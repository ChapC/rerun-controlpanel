import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import MovieIcon from '@material-ui/icons/Movie';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import StopIcon from '@material-ui/icons/Stop';
import ReplayIcon from '@material-ui/icons/Replay';
import PauseIcon from '@material-ui/icons/Pause';
import AddIcon from '@material-ui/icons/Add';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DynamicFeedIcon from '@material-ui/icons/DynamicFeed';
import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { Schedule } from '../Schedule';
import moment from 'moment';
import FullscreenModal from '../FullscreenModal';
import { ContentBlockEditor } from '../ContentBlockEditor';

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
  },
  cardTitle: {
    fontWeight: 500,
    color: '#5a4be3',
    marginBottom: 5,
    paddingLeft: 15,
  },
  largeTransparentIcon: {
    height: 60,
    width: 60,
    opacity: 0.5,
  },
  subDetailTitle: {
    fontWeight: 400,
    marginRight: 3,
  },
  vDivider: {
    marginLeft: 3,
    marginRight: 3,
    color: 'rgba(0,0,0,1)',
  },
  fullLengthProgress: {
    width: '100%',
    marginLeft: 5,
    marginRight: 5
  },
  fullButtonGroup: {
    width: '100%',
    height: '100%'
  },
  pauseIcon: {
    color: 'white',
    fontSize: '5em'
  }
}));

const nothingOnScreen = { media: { name: '-', durationMs: 0, location: {} } };
const contentLoading = { media: { name: 'Loading...', durationMs: 0, location: {} } };

const contentBlockTemplate = {
  colour: '#282482',
  media: {
    name: '', type: '', location: { path: '' }
  },
  playbackConfig: {
    trimStartSec: 0, trimEndSec: 0
  }
}

let currentProgressTimer = null;

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

export function Dashboard(props) {
  const [playbackState, setPlaybackState] = useState('Loading');
  const [onScreenBlock, setOnScreenBlock] = useState(null);
  const [scheduleList, setScheduleList] = useState([]);
  const [progressMs, setProgressMs] = useState(0);
  const [playerPauseReason, setPauseReason] = useState(null);
  const [addBlockMenuEl, setAddBlockMenuEl] = useState(null);
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);

  const server = props.server;

  useEffect(() => {
    const listener = server.addMessageListener('setPlayerState', (messageData) => {
      setNewPlayerState(messageData);
    });

    if (onScreenBlock == null) {
      requestPlayerRefresh();
    } else {
      //Resume the timer if one isn't already in progress
      if (currentProgressTimer == null) {
        if (onScreenBlock.media.durationMs != null) {
          currentProgressTimer = setInterval(() => setProgressMs(prevProgress => prevProgress + 500), 500);
        }
      }
    }

    return () => {
      server.removeMessageListener(listener)
      clearInterval(currentProgressTimer);
      currentProgressTimer = null;
    };
  });

  const setNewPlayerState = (newState) => {
    setPlaybackState(newState.playbackState);
    setOnScreenBlock(newState.currentBlock);
    setScheduleList(newState.queue);
    setProgressMs(newState.progressMs);
    setPauseReason(newState.pauseReason);

    //Reset the progress timer
    clearInterval(currentProgressTimer);
    if (newState.currentBlock.media.durationMs != null) {
      currentProgressTimer = setInterval(() => setProgressMs(prevProgress => prevProgress + 500), 500);
    }
  }

  const classes = userStyles();

  const requestPlayerRefresh = () => {
    console.info('Requesting player state refresh...');
    server.request('playerRefresh').then((newPlayerState) => {
      console.info('Received new player state', newPlayerState);
      setNewPlayerState(newPlayerState);
    });
  }

  const onScheduleListChange = (newList, changeObject) => {
    setScheduleList(newList); //Update the local list

    console.info('Requesting schedule change', changeObject);
    server.request('scheduleChange', changeObject).then((response) => {
      console.info('Schedule change accepted');
    }).catch((error) => {
      console.error('Schedule change request failed: ', error);

      if (error.code === 'IdMismatch' || error.code === 'OutOfBounds') {
        //Our copy of the schedule is probably outdated
        requestPlayerRefresh();
      }
    });
  }

  const onNextBlockClicked = () => {
    console.info('Requesting move to next ContentBlock');
    server.request('nextBlock').then(() => console.info('Next ContentBlock accepted')).catch((error) => {
      console.error('Next ContentBlock request failed: ', error);

      if (error.code === 'NoNextBlock') {
        //Our copy of the schedule is probably outdated!!!!!!
        requestPlayerRefresh();
      }
    });
  }  

  const onStopClicked = () => {
    console.info('Requesting stop to title');
    server.request('stopToTitle').then(() => console.info('Stop to title accepted')).catch((error) => {
      console.error('Stop to title request failed: ', error);
    });
  }

  const onRestartClicked = () => {
    console.info('Requesting playback restart');
    server.request('restartPlayback').then(() => console.info('Playback restart accepted')).catch((error) => {
      console.error('Media restart request failed: ', error);
    });
  }

  const [showCreateBlockEditor, setShowCreateBlockEditor] = useState(false);
  const [createBlockEditorTarget, setCreateBlockEditorTarget] = useState(contentBlockTemplate);
  const openCreateBlockEditor = () => {
    setCreateBlockEditorTarget(Object.assign({}, contentBlockTemplate));
    setShowCreateBlockEditor(true);
    setShowAddBlockMenu(false);
  }

  const onBlockEditorSubmit = () => {
    props.server.request('addContentBlock', { block: createBlockEditorTarget }).then(() => {
      setShowCreateBlockEditor(false);
    }).catch(error => {
      console.error('Content block update failed', error);
      alert('Error from server:\n' + error.message);
    });
  }

  const onCreateBlockChange = (changedProperty, newValue) => {
    //Changedproperty supports setting object members with the syntax 'object.child.targetproperty'
    let objectNames = changedProperty.split('.');
    let targetPropertyName = objectNames.splice(-1, 1)[0];

    let modifiedBlock = Object.assign({}, createBlockEditorTarget);

    let targetObject = modifiedBlock;
    for (let objectName of objectNames) {
      targetObject = targetObject[objectName];
    }
    targetObject[targetPropertyName] = newValue;

    setCreateBlockEditorTarget(modifiedBlock);
  }

  const openAddBlockMenu = (event) => {
    setAddBlockMenuEl(event.currentTarget);
    setShowAddBlockMenu(true);
  }

  let onScreen = nothingOnScreen;
  let currentDuration = '0:00';
  let currentProgressMs = '0:00';
  let currentProgressBarValue = 0;
  let scheduleStartTime = moment();
  let scheduleListLength = scheduleList ? scheduleList.length : 0;
  let playerPaused = (playerPauseReason != null);
  
  if (playbackState === 'InBlock') {
    if (onScreenBlock != null) {
      onScreen = onScreenBlock;
  
      if (onScreenBlock.media.durationMs != null) {
        currentDuration = millisToMinutesAndSeconds(onScreenBlock.media.durationMs);
        currentProgressMs = millisToMinutesAndSeconds(progressMs);
        currentProgressBarValue = progressMs / onScreenBlock.media.durationMs * 100;
        scheduleStartTime = scheduleStartTime.add(onScreenBlock.media.durationMs - progressMs, 'milliseconds');
      } else {
        //Infinite duration
        currentDuration = currentProgressMs = '∞'
      }
    }
  } else if (playbackState === 'Loading') {
    onScreen = contentLoading;
  } else if (playbackState === 'Error') {
    
  }


  return (
    <div style={{ position: 'relative' }}>
      <Card className='statusCard'>
        <div className='statusPauseOverlay' style={{ display: (playerPaused ? 'flex' : 'none') }}>
          <PauseIcon className={classes.pauseIcon} />
          <Typography variant="h5">Paused by {(playerPaused ? playerPauseReason.source : '')}</Typography>
        </div>
        <div style={{ filter: (playerPaused ? 'blur(5px)' : 'none') }}>
          <Typography variant="h5" className={classes.cardTitle}>On screen now</Typography>

          <div className='currentContentContainer'>
            <div className='currentContentThumb'>
              <MovieIcon className={classes.largeTransparentIcon}></MovieIcon>
            </div>
            <div className='currentContentDetails'>
              <Typography variant="h4" style={{ fontSize: '1.5em', paddingBottom: '5px' }} noWrap>{onScreen.media.name}</Typography>
              <div style={{ display: 'flex' }}>
                <div className='currentContentSubDetails'>
                  <Typography variant="subtitle2" className={classes.subDetailTitle}>Content type:</Typography>
                  <Typography variant="subtitle2">{onScreen.media.type}</Typography>
                  <Divider orientation='vertical' className={classes.vDivider}></Divider>
                  <Typography variant="subtitle2" className={classes.subDetailTitle}>Source:</Typography>
                  <Typography variant="subtitle2">{onScreen.media.location.type}</Typography>
                </div>
                <div className='flexSpacer'></div>
              </div>
              <div className='currentProgressContainer'>
                <Typography variant="subtitle1">{currentProgressMs}</Typography>
                <LinearProgress variant={playbackState === 'Loading' ? "indeterminate" : "determinate"} 
                    value={currentProgressBarValue} className={classes.fullLengthProgress} />
                <Typography variant="subtitle1">{currentDuration}</Typography>
              </div>
            </div>
          </div>

          <div className='onScreenActions'>
            <ButtonGroup color="primary" aria-label="outlined primary button group" className={classes.fullButtonGroup}>
              <Button disabled={scheduleListLength < 1 || playbackState !== 'InBlock'} className='flexButton' startIcon={<SkipNextIcon />} onClick={onNextBlockClicked}>Next block</Button>
              <Button className='flexButton' startIcon={<StopIcon />} onClick={onStopClicked}>Stop to title</Button>
              <Button disabled={playbackState !== 'InBlock'} className='flexButton' startIcon={<ReplayIcon />} onClick={onRestartClicked}>Restart playback</Button>
            </ButtonGroup>
          </div>
        </div>
      </Card>

      <div>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
          <Typography variant="h6" noWrap>Queue</Typography>
          <Divider style={{ flex: 1, margin: '0 10px' }} />
          <Button variant='outlined' size='small' startIcon={<AddIcon />} onClick={openAddBlockMenu}>
            Add content block
          </Button>
          <Menu open={showAddBlockMenu} anchorEl={addBlockMenuEl} onClose={() => setShowAddBlockMenu(false)}>
            <MenuItem onClick={openCreateBlockEditor}>
              <ListItemIcon>
                <AddCircleIcon />
              </ListItemIcon>
              <Typography variant='inherit' noWrap>Create new block</Typography>
            </MenuItem>
            <MenuItem onClick={() => setShowAddBlockMenu(false)}>
              <ListItemIcon>
                <DynamicFeedIcon />
              </ListItemIcon>
              <Typography variant='inherit' noWrap>Pull from content source</Typography>
            </MenuItem>
          </Menu>
        </div>

        <Schedule items={scheduleList} startTime={scheduleStartTime} onListUpdate={onScheduleListChange}
          server={server} style={{ width: '100%', minHeight: '100px', maxHeight: '50vh' }} />

        <FullscreenModal title={'Create content block'} onSubmit={onBlockEditorSubmit}
          show={showCreateBlockEditor} onCancel={() => setShowCreateBlockEditor(false)}>
          <ContentBlockEditor block={createBlockEditorTarget} onPropertyChange={onCreateBlockChange} />
        </FullscreenModal>
      </div>
    </div>
  )
}