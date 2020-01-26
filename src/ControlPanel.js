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
import {Dashboard} from './Dashboard';
import {SideNavList} from './SideNavList';
import { BrowserRouter, Route, Link } from "react-router-dom";

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

  //ServerConnection setup
  if (server == null) {
    setServer(new ServerConnection('ws://192.168.0.122:8080/controlWS'));
  }

  return (
    <div>
      <AppBar position="static">
        <Toolbar className={classes.headerbar}>
          <IconButton edge="start" className={classes.menuButton} onClick={()=>setDrawerOpen(true)} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer anchor='left' open={drawerOpen} onClose={()=>setDrawerOpen(false)}>
        <SideNavList />
      </Drawer>

      <div id='pageContent'>
        <Dashboard server={server}/>
      </div>
    </div>
  );
}

export default ControlPanel;
