import React, { useState, useEffect, useRef } from 'react';
import { Typography, ButtonGroup, Button, Divider, LinearProgress, Paper } from '@material-ui/core';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import IntervalMillisCounter from '../../helpers/IntervalMillisCounter';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import StopIcon from '@material-ui/icons/Stop';
import ReplayIcon from '@material-ui/icons/Replay';
import './LayersView.css';

const userStyles = makeStyles( theme => ({
    fullLengthProgress: {
        width: '100%',
        marginLeft: 5,
        marginRight: 5
    }
}));

let predictedProgressTimer;
let playbackListener;

export default function OnScreenNowWidget(props) {
    const theme = useTheme();
    const classes = userStyles();
    const reallySmallScreen = useMediaQuery(theme.breakpoints.down('xs'))
    const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const [playingBlocks, setPlayingBlocks] = useState(null);
    const [msSinceUpdate, setMsSinceUpdate] = useState(0);

    const acceptPlayingBlocksFromServer = (playingBlocks) => {
        predictedProgressTimer.stop();
        setPlayingBlocks(playingBlocks);
        setMsSinceUpdate(0);
        predictedProgressTimer.start(0);
    }

    useEffect(() => {
        if (playingBlocks == null) { //Request player state if we don't have it yet
            props.server.sendRequest('getPlayingBlocks').then(acceptPlayingBlocksFromServer);
            //Change listener
            playbackListener = props.server.onAlert('playerStateChanged', acceptPlayingBlocksFromServer);
            //Client-side progress counter
            predictedProgressTimer = new IntervalMillisCounter(500, setMsSinceUpdate);
        }
    }, [playingBlocks, props.server]);

    useEffect(() => () => {
        props.server.offAlert(playbackListener);
        predictedProgressTimer.stop();
    }, []);

    let currentBlockIsInfinite = playingBlocks ? playingBlocks[0].media.durationMs == null : false;
    let currentBlockEndTime = playingBlocks ? millisToHrsMinsSec(playingBlocks[0].media.durationMs) : '-:--';
    if (currentBlockIsInfinite) {
        currentBlockEndTime = '∞';
    }

    // Playback controls
    const nextBlock = () => {
        props.server.sendRequest('skipForward').then((res) => {
            console.info('Skipped forward');
        }).catch(error => {
            console.error('Skip forward request failed', error);
        })
    };

    const stopToTitle = () => {
        props.server.sendRequest('stopToTitle').then((res) => {
            console.info('Stopped');
        }).catch(error => {
            console.error('Stop to title request failed', error);
        })
    };

    const restartBlock = () => {
        props.server.sendRequest('restartBlock').then((res) => {
            console.info('Restarted');
        }).catch(error => console.error('Restart block request failed', error))
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: reallySmallScreen ? 'column' : 'row', overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection:'column', paddingRight: '10px', boxSizing:'border-box', flex: 1, overflow: reallySmallScreen ? '' : 'hidden' }}>
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <div style={{ width: '100%', maxWidth: '350px' }}>
                            <div style={{ width: '100%', paddingTop: '56.25%', backgroundColor: '#d9d9d9' }}>
                            </div>
                        </div>
                    </div>
                    <Typography variant='h5' style={{ textOverflow: 'ellipsis', overflow: 'hidden', textAlign: 'center', whiteSpace: 'nowrap', padding: '5px 0' }}>{playingBlocks ? playingBlocks[0].media.name : '???'}</Typography>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 15px' }}>
                        <div style={{ backgroundColor: '#f0f0f0', borderRadius: '3px', padding: '0 5px', display: 'flex', alignItems: 'center', border: '1px solid #9b9b9b' }}>
                            <Typography variant="subtitle2">Content type: {playingBlocks ? playingBlocks[0].media.type : '?'}</Typography>
                            <Divider orientation='vertical' style={{ margin: '0 5px' }}></Divider>
                            <Typography variant="subtitle2">Source: {playingBlocks ? friendlyLocationOrDefault(playingBlocks[0].media.location.contentType) : '?'}</Typography>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Typography variant="subtitle1">{playingBlocks ? millisToHrsMinsSec(playingBlocks[0].progressMs + msSinceUpdate) : '-:--'}</Typography>
                            <LinearProgress variant={currentBlockIsInfinite ? 'indeterminate' : 'determinate'} className={classes.fullLengthProgress} 
                             value={playingBlocks ? ((playingBlocks[0].progressMs + msSinceUpdate) / playingBlocks[0].media.durationMs) * 100 : 0} />
                            <Typography variant="subtitle1">{currentBlockEndTime}</Typography>
                        </div>
                    </div>

                    <ButtonGroup color="primary" aria-label="outlined primary button group" orientation={smallScreen ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
                        <Button style={{ flex: 1 }} startIcon={<SkipNextIcon />} onClick={nextBlock}>Next block</Button>
                        <Button style={{ flex: 1 }} startIcon={<StopIcon />} onClick={stopToTitle}>Stop to title</Button>
                        <Button style={{ flex: 1 }} startIcon={<ReplayIcon />} onClick={restartBlock}>Restart block</Button>
                    </ButtonGroup>
                </div>
                <Divider orientation={reallySmallScreen ? 'horizontal' : 'vertical'} style={{ margin: '10px 0', alignSelf: reallySmallScreen ? '' : 'center' }} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0px 10px'}}>
                    <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
                        <LayersView blocks={playingBlocks} msSinceUpdate={msSinceUpdate} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function LayersView(props) {
    let layerComponents = null;
    if (props.blocks) {
        layerComponents = [];
        for (let i = props.blocks.length - 1; i > -1; i--) {
            let block = props.blocks[i];
            layerComponents.push(<Layer media={block.media} key={block.id} progressMs={block.progressMs + props.msSinceUpdate} />);
        }
    }

    return (
        <div className='layerViewRoot'>
            {layerComponents}
        </div>
    );
}

function Layer(props) {
    return (
        <Paper variant='outlined' className='layerPaper' style={{ borderColor: '#ad98d6' }}>
            <div className='layerForeground'>
                <div className='layerThumbContainer'>
                    <div className='layerThumb'></div>
                </div>
                <div className='layerTextContainer'>
                    <Typography variant='h4' style={{ fontSize: '1.4rem' }}>{props.media.name}</Typography>
                    <Typography variant='subtitle1'>{props.media.type}</Typography>
                </div>
            </div>
            <div className='layerProgress' style={{ transform: `scaleX(${props.media.durationMs ? props.progressMs / props.media.durationMs : 0})` }}></div>
        </Paper>
    );
}

const friendlyLocationTypes = {
    'GraphicsLayer': 'Graphics package',
    'LocalFile' : 'On disk',
    'WebStream': 'Web stream'
}

function friendlyLocationOrDefault(location) {
    let friendly = friendlyLocationTypes[location];
    if (friendly == null) {
      friendly = location;
    }
    return friendly;
}

function millisToHrsMinsSec(millis) {
    let hours = Math.floor((millis / 3600000) % 60);
    let minutes = Math.floor((millis / 60000) % 60);
    let seconds = Math.floor((millis / 1000) % 60);
    return `${hours >=1 ? hours + ':' : ''}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}