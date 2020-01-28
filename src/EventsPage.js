import React, { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import './EventsPage.css';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Switch from '@material-ui/core/Switch';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import AlarmIcon from '@material-ui/icons/Alarm';
import EditIcon from '@material-ui/icons/Edit';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import { BoltIcon } from './res/BoltIcon';

const userStyles = makeStyles(theme => ({
    eventTitle: {
        fontSize: '1.2em'
    }
}));

export function EventsPage(props) {
    const server = props.server;
    const [eventsList, setEventsList] = useState(null);

    useEffect(() => {
        if (eventsList == null) {
            server.request('getEvents').then((events) => {
                setEventsList(events);
            }).catch(error => {
                console.error('Failed to fetch events:', error);
            });
        }

        const listener = server.addMessageListener('setEventList', (newEventList) => setEventsList(newEventList));

        return () => server.removeMessageListener(listener);
    });

    const onSetEventEnabled = (eventId, isEnabled) => {
        server.request('setEventEnabled', {eventId: eventId, enabled: isEnabled})
            .catch((error) => console.error('Failed to set event enabled: ', error));
    }

    let cards = null;
    if (eventsList != null) {
        cards = eventsList.map((tEvent, index) => (
            <EventCard event={tEvent.event} enabled={tEvent.enabled} 
                onSetEnabled={(enabled) => onSetEventEnabled(tEvent.id, enabled)} 
                key={'eventcard' + tEvent.id} />
        ))
    }

    return (
        <div>
            <div className='eventCardGrid'>
                {cards}
            </div>
        </div>
    );
}

const PurpleSwitch = withStyles({
    switchBase: {
        '&$checked': {
            color: '#2f2da6',
        },
        '&$checked + $track': {
            backgroundColor: '#2f2da6',
        },
    },
    checked: {},
    track: {},
})(Switch);

const nth = function (d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

function EventCard(props) {
    const classes = userStyles();
    const mEvent = props.event;

    let eventTypeText = props.event.type + ' event';

    //Default event descriptions
    let eventDescription = (<div className='flexCenter backgroundText'><Typography variant='subtitle1'>[Custom event]</Typography></div>)
    let actionDescription = (<div className='flexCenter'><Typography variant='subtitle2'>?</Typography></div>);
    let actionName = 'Run a server action';

    //Use the action renderer for this event's action type
    if (mEvent.action.type === 'GraphicEvent') {
        actionName = 'Play a graphic';
        let waitTime = null;
        if (mEvent.type === 'Player' && mEvent.targetPlayerEvent === 'inbetween' && mEvent.action.eventOffset !== 0) {
            waitTime = (
                <div style={{alignItems:'center'}}>
                    <Typography variant='subtitle2'>Pause {mEvent.eventOffset / 1000} seconds</Typography>
                </div>
            );
        }
        let outEvent = null;
        if (mEvent.action.eventOut && mEvent.action.eventOut !== '') {
            outEvent = (
                <div style={{alignItems:'center'}}>
                    <DoubleArrowIcon style={{transform: 'scaleX(-1)'}} />
                    <Typography variant='subtitle2'>{mEvent.action.eventOut}</Typography>
                </div>
            );
        }
        actionDescription = (
            <div className='playerEventDescription'>
                <div style={{alignItems:'center'}}>
                    <DoubleArrowIcon />
                    <Typography variant='subtitle2'>{mEvent.action.eventIn}</Typography>
                </div>
                {waitTime}
                {outEvent}
            </div>
        );
    }
    
    //Use the description renderer for this type of event
    if (mEvent.type === 'Player') {
        let relTimeQualifier = 'Inbetween the blocks';
        if (mEvent.targetPlayerEvent === 'start') {
            if (mEvent.eventOffset === 0) {
                relTimeQualifier = 'At the start'
            } else {
                relTimeQualifier = (mEvent.eventOffset / 1000) + 's after the start'
            }
        } else if (mEvent.targetPlayerEvent === 'end') {
            if (mEvent.eventOffset === 0) {
                relTimeQualifier = 'At the end'
            } else {
                relTimeQualifier = (mEvent.eventOffset / 1000) + 's before the end'
            }
        }
        eventDescription = (
            <div className='playerEventDescription'>
                <div>
                    <PlayCircleOutlineIcon className='playerEventIcon' />
                    <Typography>
                        Every {mEvent.frequency === 1 ? '' : mEvent.frequency + nth(mEvent.frequency) + ' '}block
                    </Typography>
                </div>
                <div>
                    <AlarmIcon className='playerEventIcon' />
                    <Typography>{relTimeQualifier}</Typography>
                </div>
                <div>
                    <BoltIcon className='playerEventIcon' />
                    <div style={{width: '100%'}}>
                        <Typography>{actionName}</Typography>
                        <div className='playerEventActionContainer'>
                            {actionDescription}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    let bodyStyle = {};
    if (!props.enabled) {
        bodyStyle = {userSelect: 'none', opacity: 0.5};
    }

    return (
        <Card className='eventCardRoot'>
            <div className='eventCardHeader'>
                <Typography variant='h5' className={classes.eventTitle} noWrap>{mEvent.name}</Typography>
                <PurpleSwitch size='small' checked={props.enabled} onChange={() => props.onSetEnabled(!props.enabled)} inputProps={{ 'aria-label': 'event enabled' }} />
            </div>
            <div className='eventCardBody' style={bodyStyle}>
                {eventDescription}
            </div>
            <div className='eventCardFooter'>
                <IconButton size='small'>
                    <EditIcon />
                </IconButton>
                <Typography variant='subtitle1' className='backgroundText' noWrap>{eventTypeText}</Typography>
                <IconButton size='small'>
                    <DeleteIcon />
                </IconButton>
            </div>
        </Card>
    );
}