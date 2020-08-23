import React, { useState, useEffect } from 'react';
import './ControlPanel.css';
import { makeStyles, useMediaQuery, useTheme } from '@material-ui/core';
import { AppBar, Toolbar, Typography, IconButton, Drawer, Hidden } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { WSConnection } from './helpers/WebsocketConnection';
import { WebsocketHeartbeat } from './helpers/WebsocketHeartbeat';
import { Dashboard } from './pages/Dashboard';
import { SideNavList } from './components/SideNavList';
import { Route, Switch } from "react-router-dom";
import { EventsPage } from './pages/EventsPage';
import { ContentSourcesPage } from './pages/ContentSourcesPage';
import SettingsPage from './pages/SettingsPage';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import Button from '@material-ui/core/Button';

const userStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  headerbar: {
    backgroundColor: '#552da6',
  }
}));

function ControlPanel() {
  const classes = userStyles();
  const [server, setServer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showConnectOverlay, setShowConnectOverlay] = useState(true);
  const [disconnected, setDisconnected] = useState(false);
  const [alertList, setAlertList] = useState(null);

  //ServerConnection setup
  const connect = () => {
    const serverAddress = 'ws://' + window.location.hostname + ':8080/controlWS';
    console.info('Connecting to Rerun server at ' + serverAddress + '...');
    setDisconnected(false);

    let socket = new WebSocket(serverAddress);
    new WebsocketHeartbeat(socket);
    const serverConn = new WSConnection(socket);
    serverConn.on('open', () => {
      setShowConnectOverlay(false);
    });
    serverConn.on('close', () => {
      setShowConnectOverlay(true);
      setDisconnected(true);
    });
    setServer(serverConn);
  }

  if (server == null) {
    connect();
  }

  useEffect(() => {
    if (alertList == null) {
      server.sendRequest('getAlerts').then((alerts) => setAlertList(alerts)).catch(error => console.error('Error fetching alerts', error));
    }

    const alertListener = server.onAlert('setAlerts', (alerts) => setAlertList(alerts));

    return () => {
      server.offAlert(alertListener);
    }
  });

  const appBarTitle = (path) => {
    switch (path) {
      case '/events': return 'Events';
      case '/sources': return 'Content sources';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  }

  const theme = useTheme();
  const largeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  return (
    <Route>
      {({ location, history }) => (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
          <ConnectOverlay show={showConnectOverlay} failed={disconnected} onReconnectClicked={() => window.location.reload()} />

          <div className='controlPanelRoot'>
            <AppBar position='static'>
              <Toolbar className={classes.headerbar}>
                <Hidden lgUp>
                  <IconButton edge="start" className={classes.menuButton} onClick={() => setDrawerOpen(true)} color="inherit" aria-label="menu">
                    <MenuIcon />
                  </IconButton>
                </Hidden>
                <Typography variant="h6" className={classes.title}>
                  {appBarTitle(location.pathname)}
                </Typography>
              </Toolbar>
            </AppBar>

            <Drawer anchor='left' variant={largeScreen ? 'permanent' : 'temporary'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <SideNavList location={location} navTo={(address) => { history.push(address); setDrawerOpen(false); }} />
            </Drawer>

            <div id='pageContainer'>
              <div id='pageContent'>
                <Switch>
                  <Route exact path='/'>
                    <Dashboard server={server} alerts={alertList} />
                  </Route>
                  <Route exact path='/events'>
                    <EventsPage server={server} />
                  </Route>
                  <Route exact path='/sources'>
                    <ContentSourcesPage server={server} />
                  </Route>
                  <Route exact path='/settings'>
                    <SettingsPage server={server} />
                  </Route>
                </Switch>
              </div>
            </div>
          </div>          
        </div>

      )}
    </Route>
  );
}

function ConnectOverlay(props) {
  if (!props.failed) {
    return (
      <div id='connectOverlay' style={{ display: props.show ? 'flex' : 'none' }}>
        <CircularProgress />
        <Typography variant='h3' id='connectText'>Connecting to Rerun</Typography>
      </div>
    );
  } else {
    return (
      <div id='connectOverlay' style={{ display: props.show ? 'flex' : 'none' }}>
        <div id='coError'>
          <ErrorOutlineIcon />
          <Typography variant='h3' id='connectText'>Lost connection to Rerun</Typography>
          <Button variant='outlined' onClick={props.onReconnectClicked}>Try reconnect</Button>
        </div>
      </div>
    );
  }
}

export default ControlPanel;
