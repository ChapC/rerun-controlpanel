import React, { useState } from 'react';
import './Dashboard.css';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import MovieIcon from '@material-ui/icons/Movie';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import StopIcon from '@material-ui/icons/Stop';
import ReplayIcon from '@material-ui/icons/Replay';
import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
import LinearProgress from '@material-ui/core/LinearProgress';
import {Schedule} from './Schedule';
import moment from 'moment';

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
    }
  }));

const nothingOnScreen = {media: {name: '-', durationMs: 0, location: {}}};

let currentProgressTimer = null;

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

export function Dashboard(props) {
    const [onScreenBlock, setOnScreenBlock] = useState(null);
    const [scheduleList, setScheduleList] = useState([]);
    const [progressMs, setProgressMs] = useState(0);
    const [hasSetServerCallbacks, setDidCallback] = useState(false);

    const server = props.server;
    if (!hasSetServerCallbacks) {
        server.onMessage('setPlayerState', (messageData) => {
            setNewPlayerState(messageData);
        });
        setDidCallback(true);
    }
  
    const setNewPlayerState = (newState) => {
      setOnScreenBlock(newState.currentBlock);
      setScheduleList(newState.queue);
      setProgressMs(newState.progressMs);
  
      //Reset the progress timer
      if (currentProgressTimer != null) {
        clearInterval(currentProgressTimer);
      }
  
      currentProgressTimer = setInterval(() => {
        setProgressMs((prevProgress) => prevProgress + 500);
      }, 500);
    }

  
    const classes = userStyles();
  
    const requestPlayerRefresh = () => {
      console.info('Requesting player state refresh...');
          server.request('playerRefresh').then((newPlayerState) => {
            console.info('Received new player state');
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
  
    let onScreen = nothingOnScreen;
    let currentDuration = '0:00';
    let currentProgressMs = '0:00';
    let currentProgressBarValue = 0;
    let scheduleStartTime = moment();
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

    return (
        <div>
            <Card className='statusCard'>
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
                            <LinearProgress variant="determinate" value={currentProgressBarValue} className={classes.fullLengthProgress} />
                            <Typography variant="subtitle1">{currentDuration}</Typography>
                        </div>
                    </div>
                </div>

                <div className='onScreenActions'>
                    <ButtonGroup color="primary" aria-label="outlined primary button group" className={classes.fullButtonGroup}>
                        <Button className='flexButton' startIcon={<SkipNextIcon />} onClick={onNextBlockClicked}>Next block</Button>
                        <Button className='flexButton' startIcon={<StopIcon />} onClick={onStopClicked}>Stop to title</Button>
                        <Button className='flexButton' startIcon={<ReplayIcon />} onClick={onRestartClicked}>Restart playback</Button>
                    </ButtonGroup>
                </div>
            </Card>

            <div>
                <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    <Typography variant="h6" noWrap>Queue</Typography>
                    <Divider style={{ flex: 1, marginLeft: '10px' }} />
                </div>

                <Schedule items={scheduleList} startTime={scheduleStartTime} onListUpdate={onScheduleListChange}
                    style={{ width: '100%', minHeight: '100px', maxHeight: '50vh' }} />
            </div>
        </div>
    )
}