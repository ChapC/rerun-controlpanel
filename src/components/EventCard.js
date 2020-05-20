import React from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Switch, Card, Typography, IconButton } from '@material-ui/core';
import { BoltIcon } from '../res/BoltIcon';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import AlarmIcon from '@material-ui/icons/Alarm';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import EventNoteIcon from '@material-ui/icons/EventNote';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

export default function EventCard(props) {
    const classes = userStyles();
    const mEvent = props.event;

    //Default event descriptions
    let logicDescription = (<div className='flexCenter backgroundText'><Typography variant='subtitle1'>[Custom event]</Typography></div>)
    let actionDescription = (<div className='flexCenter'><Typography variant='subtitle2'>?</Typography></div>);

    //Use the action renderer for this event's action type
    if (actionDescriptionRenderers[mEvent.actionType] != null) {
        actionDescription = actionDescriptionRenderers[mEvent.actionType](mEvent);
    }

    //Use the description renderer for this type of event
    if (logicDescriptionRenderers[mEvent.logicType] != null) {
        logicDescription = logicDescriptionRenderers[mEvent.logicType](mEvent);
    }

    let bodyStyle = {};
    if (!props.enabled) {
        bodyStyle = { userSelect: 'none', opacity: 0.5 };
    }

    return (
        <Card className='eventCardRoot'>
            <div className='eventCardHeader'>
                <Typography variant='h6' className={classes.eventTitle} noWrap>{mEvent.name}</Typography>
                <PurpleSwitch size='small' checked={props.enabled} onChange={() => props.onSetEnabled(!props.enabled)} inputProps={{ 'aria-label': 'event enabled' }} />
            </div>
            <div className='eventCardBody' style={bodyStyle}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                        <div className='eventCardSectionIcon'>
                            <EventNoteIcon />
                        </div>
                        <Typography variant='h5' className='eventCardSectionTitle'>{mEvent.logicType}</Typography>
                    </div>
                    <div className='eventCardSection'>
                        <div className='eventCardSectionBar'></div>
                        <div className='eventCardDescriptionContainer'>
                            {logicDescription}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                        <div className='eventCardSectionIcon'>
                            <BoltIcon style={{ color: 'white' }} />
                        </div>
                        <Typography variant='h5' className='eventCardSectionTitle'>Show a graphic</Typography>
                    </div>
                    <div className='eventCardSection'>
                        <div className='eventCardSectionBar'></div>
                        <div className='eventCardDescriptionContainer'>
                            {actionDescription}
                        </div>
                    </div>
                </div>
            </div>
            <div className='eventCardFooter'>
                <IconButton size='small' onClick={props.onEditClicked}>
                    <EditIcon />
                </IconButton>
                <IconButton size='small' onClick={props.onDeleteClicked}>
                    <DeleteIcon />
                </IconButton>
            </div>
        </Card>
    );
}

//Logic renderers
const logicDescriptionRenderers = {
    'During a block': e => <InBlockLogic event={e} />,
    'In-between blocks': e => <BetweenBlockLogic event={e} />
}

function InBlockLogic(props) {
    let relTimeQualifier = '';
    if (props.event.logic.fromPosition === 'Start of block') {
        if (props.event.logic.eventOffsetSecs === 0) {
            relTimeQualifier = 'At the start'
        } else {
            relTimeQualifier = props.event.logic.eventOffsetSecs + 's after the start'
        }
    } else if (props.event.logic.fromPosition === 'End of block') {
        if (props.event.logic.eventOffsetSecs === 0) {
            relTimeQualifier = 'At the end'
        } else {
            relTimeQualifier = props.event.logic.eventOffsetSecs + 's before the end'
        }
    }

    return (
        <div className='playerEventDescription'>
            <div>
                <PlayCircleOutlineIcon className='playerEventIcon' />
                <Typography>
                    Every {props.event.logic.frequency === 1 ? '' : props.event.logic.frequency + nth(props.event.logic.frequency) + ' '}block
                </Typography>
            </div>
            <div>
                <AlarmIcon className='playerEventIcon' />
                <Typography>{relTimeQualifier}</Typography>
            </div>
        </div>
    );
}

function BetweenBlockLogic(props) {
    return (
        <div className='playerEventDescription'>
            <div>
                <PlayCircleOutlineIcon className='playerEventIcon' />
                <Typography>
                    After every {props.event.logic.frequency === 1 ? '' : props.event.logic.frequency + nth(props.event.logic.frequency) + ' '}block
                </Typography>
            </div>
        </div>
    )
}

//Action renderers
const actionDescriptionRenderers = {
    'Show a graphic': (e) => <ShowGraphicAction event={e} />
}

function ShowGraphicAction(props) {
    let waitTime = null;
    let outEvent = null;

    return (
        <div className='playerEventDescription'>
            <div style={{ alignItems: 'center' }}>
                <DoubleArrowIcon />
                <Typography>{props.event.action.targetLayerName}</Typography>
            </div>
            {waitTime}
            {outEvent}
        </div>
    );
}

//Utils
const userStyles = makeStyles(theme => ({
    eventTitle: {
        fontSize: '1.2em'
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    }
}));

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