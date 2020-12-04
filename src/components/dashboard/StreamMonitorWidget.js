import React, { useState, useEffect } from 'react';
import { useTheme } from '@material-ui/core/styles';
import { ButtonGroup, Button, useMediaQuery, Typography } from '@material-ui/core';
import './StreamMonitorWidget.css';
import CircularProgress from '@material-ui/core/CircularProgress';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

export default function StreamMonitorWidget(props) {
    const theme = useTheme();
    const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    let status = 'offline';

    let statusIcon, statusText;

    if (status === 'connecting') {
        statusIcon = <CircularProgress />;
        statusText = 'Connecting...';
    } else if (status === 'offline') {
        statusIcon = <CancelIcon style={{ fontSize: '60px', opacity: 0.5 }} />;
        statusText = 'Stream offline';
    } else if (status === 'streaming') {
        statusIcon = <CheckCircleIcon style={{ fontSize: '60px', color: 'limegreen' }} />;
        statusText = 'Streaming';
    }

    return (
        <div className='smwRoot'>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                {statusIcon}
                <Typography variant='h4' style={{ marginTop: '10px' }}>{statusText}</Typography>
                <Typography variant='subtitle1'>{ status === 'offline' ? '' : 'rtmp://a.rtmp.youtube.com/live2'}</Typography>
            </div>
            <ButtonGroup color="primary" aria-label="outlined primary button group" orientation={smallScreen ? 'vertical' : 'horizontal'} style={{ width: '100%', paddingTop: '10px' }}>
                <Button disabled={status !== 'offline'} style={{ flex: 1 }}>Go live</Button>
                <Button disabled={status === 'offline'} style={{ flex: 1 }}>Stop</Button>
            </ButtonGroup>
        </div>
    )
}