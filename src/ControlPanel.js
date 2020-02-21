import React, { useState } from 'react';
import './ControlPanel.css';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Drawer from '@material-ui/core/Drawer';
import ServerConnection from './ServerConnection';
import {Dashboard} from './pages/Dashboard';
import {SideNavList} from './SideNavList';
import { Route, Switch } from "react-router-dom";
import {EventsPage} from './pages/EventsPage';
import {ContentSourcesPage} from './pages/ContentSourcesPage';
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

  //ServerConnection setup
  const connect = () => {
    console.info('Connecting to Rerun server...');
    setDisconnected(false);
    
    const serverConn = new ServerConnection('ws://' + window.location.hostname + ':8080/controlWS');
    serverConn.onOpen(() => {
      setShowConnectOverlay(false);
    });
    serverConn.onClose(() => {
      setShowConnectOverlay(true);
      setDisconnected(true);
    });
    setServer(serverConn);
  }

  if (server == null) {
    connect();
  }

  const appBarTitle = (path) => {
    switch (path) {
      case '/events': return 'Events';
      case '/sources': return 'Content sources';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  }

  return (
    <Route>
      {({ location, history }) => (
        <div style={{position: 'relative'}}>
          <AppBar position="static">
            <Toolbar className={classes.headerbar}>
              <IconButton edge="start" className={classes.menuButton} onClick={() => setDrawerOpen(true)} color="inherit" aria-label="menu">
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" className={classes.title} onClick={() => setDrawerOpen(true)} style={{cursor:'pointer'}}>
                {appBarTitle(location.pathname)}
              </Typography>
            </Toolbar>
          </AppBar>

          <Drawer anchor='left' open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <SideNavList location={location} navTo={(address) => {history.push(address); setDrawerOpen(false)}} />
          </Drawer>

          <div id='pageContent'>
            <Switch>
              <Route exact path='/'>
                <Dashboard server={server} />
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

          <ConnectOverlay show={showConnectOverlay} failed={disconnected} onReconnectClicked={() => window.location.reload()} />
        </div>
      )}
    </Route>
  );
}

function ConnectOverlay(props) {
  if (!props.failed) {
    return (
      <div id='connectOverlay' style={{display: props.show ? 'flex' : 'none'}}>
        <CircularProgress />
        <Typography variant='h3' id='connectText'>Connecting to Rerun</Typography>
      </div>
    );
  } else {
    return (
      <div id='connectOverlay' style={{display: props.show ? 'flex' : 'none'}}>
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
