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
import { BoltIcon } from '../res/BoltIcon';
import FullscreenModal from '../components/FullscreenModal';
import FormGroupEditor from '../components/editors/FormGroupEditor';
import { formOutlineToProperties, validatedPropertiesToValues } from '../components/FormGroup';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';

const userStyles = makeStyles(theme => ({
    eventTitle: {
        fontSize: '1.2em'
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    }
}));

const customFormNames = (targetEvent) => {
    let eventOffsetTitle = "Offset";
    if (targetEvent.event && targetEvent.event.logic && targetEvent.event.logic.value.targetPlayerEvent) {
        if (targetEvent.event.logic.value.targetPlayerEvent.value === "Start of block") {
            eventOffsetTitle = "Seconds after start";
        } else if (targetEvent.event.logic.value.targetPlayerEvent.value === "End of block") {
            eventOffsetTitle = "Seconds before end";
        } else if (targetEvent.event.logic.value.targetPlayerEvent.value === "Inbetween blocks") {
            eventOffsetTitle = "Inbetween pause seconds";
        }
    }

    return (
        [
            {key: "logic.value.eventOffsetSecs", name: eventOffsetTitle},
            {key: "logic", name: "Event options", placeAfter: "logicType"},
            {key: "action", placeAfter: "actionType"}
        ]
    );
};

//Convert the events from FormProperties to just their values
const eventListToValueList = (formPropertyList) => {
    let valueEvents = []; 
    formPropertyList.map((formEvent) => {
        let valuesOnly = { ...formEvent };
        valuesOnly.event = validatedPropertiesToValues(formEvent.event);
        valueEvents.push(valuesOnly);
    })
    return valueEvents;
}

export function EventsPage(props) {
    const server = props.server;
    const [eventOutline, setEventOutline] = useState(null); //The form outline of an event, used when creating events from scratch
    const [eventsList, setEventsList] = useState(null); //Events converted from forms to just values
    const [eventsFormList, setEventsFormList] = useState([]); //Events as forms, as they come from the server
    const [editorTarget, setEditorTarget] = useState({}); //The event currently being worked on in the editor
    const [showEditor, setShowEditor] = useState(false);
    const [creatingNewEvent, setCreatingNewEvent] = useState(false);

    useEffect(() => {
        if (eventsList == null) {
            server.request('getEvents').then((events) => {
                setEventsList(eventListToValueList(events));
                setEventsFormList(events);
            }).catch(error => {
                console.error('Failed to fetch events:', error);
            });
        }

        if (eventOutline == null) {
            //Grab the outline for a UserEvent object from the server
            setEventOutline({});
            server.request('getEventOutline').then((eventOutline) => {
                setEventOutline(eventOutline);
            });
        }

        const listener = server.addMessageListener('setEventList', (newEventList) => {
            setEventsList(eventListToValueList(newEventList));
            setEventsFormList(newEventList);
        });

        return () => server.removeMessageListener(listener);
    });

    const onSetEventEnabled = (eventId, isEnabled) => {
        server.request('setEventEnabled', { eventId: eventId, enabled: isEnabled })
            .catch((error) => console.error('Failed to set event enabled: ', error));
    }

    const deleteEvent = (eventId) => {
        server.request('deleteEvent', { eventId: eventId })
            .catch((error) => console.error('Failed to delete event:', error));
    }

    const showEditDialog = (eventID) => {
        //Find the target event form in eventsFormList
        let targetEvent = null;
        for (let e of eventsFormList) {
            if (e.id == eventID) {
                targetEvent = e;
                break;
            }
        }

        setEditorTarget(JSON.parse(JSON.stringify(targetEvent)));
        setCreatingNewEvent(false);
        setShowEditor(true);
    }

    const showNewEventEditor = () => {
        setEditorTarget({id: undefined, enabled: undefined, event: formOutlineToProperties(eventOutline)});
        setCreatingNewEvent(true);
        setShowEditor(true);
    }

    let cards = null;
    if (eventsList != null) {
        if (eventsList.length === 0) {
            cards = (
                <div className='centerFlex' style={{ marginTop: '10px' }}>
                    <Typography>No events</Typography>
                </div>
            );
        } else {
            cards = eventsList.map((tEvent, index) => (
                <EventCard event={tEvent.event} enabled={tEvent.enabled}
                    onSetEnabled={(enabled) => onSetEventEnabled(tEvent.id, enabled)}
                    onEditClicked={() => showEditDialog(tEvent.id)}
                    onDeleteClicked={() => deleteEvent(tEvent.id)}
                    key={'eventcard' + tEvent.id} />
            ))
        }
    }

    const onEventEditorChange = (changedProperty, newValue) => {
        //Changedproperty supports setting object members with the syntax 'object.child.targetproperty'
        let objectNames = changedProperty.split('.');
        let targetPropertyName = objectNames.splice(-1, 1)[0];

        let modifiedEvent = Object.assign({}, editorTarget.event);

        let targetObject = modifiedEvent;
        for (let objectName of objectNames) {
            targetObject = targetObject[objectName];
        }
        targetObject[targetPropertyName].value = newValue;

        let eventContainer = {
            id: editorTarget.id, enabled: editorTarget.enabled,
            event: modifiedEvent
        }

        //If the event type was changed, fetch the outline for the new type
        if (changedProperty === 'logicType') {
            server.request('getEventLogicOutline', {eventType: newValue}).then((logicOutline) => {
                editorTarget.event.logic.value = formOutlineToProperties(logicOutline);
                console.info(editorTarget)
                setEditorTarget(editorTarget);
            });
        } else if (changedProperty === 'actionType') {
            server.request('getEventActionOutline', {actionType: newValue}).then((actionOutline) => {
                editorTarget.event.action.value = formOutlineToProperties(actionOutline);
                setEditorTarget(editorTarget);
            });
        }

        setEditorTarget(eventContainer);
    }

    const eventEditorSubmit = () => {
        //Submit the current editorTarget
        if (creatingNewEvent) {
            console.info('Submitting event ', editorTarget.event);
            server.request('createEvent', editorTarget.event).then(() => setShowEditor(false));
        } else {
            server.request('updateEvent', { eventId: editorTarget.id, newEvent: editorTarget.event }).then(() => {
                setShowEditor(false);
            });
        }
    }

    return (
        <div>
            <Button variant='outlined' startIcon={<AddIcon />} onClick={showNewEventEditor} style={{ width: '100%' }}>Create event</Button>
            <div className='eventCardGrid'>
                {cards}
            </div>

            <FullscreenModal show={showEditor} title={creatingNewEvent ? 'New event' : 'Edit event'} onCancel={() => setShowEditor(false)} onSubmit={eventEditorSubmit}>
                <FormGroupEditor properties={editorTarget.event} onPropertyChange={onEventEditorChange} customNames={customFormNames(editorTarget)} server={server} />
            </FullscreenModal>
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

    let eventTypeText = mEvent.logicType + ' event';

    //Default event descriptions
    let eventDescription = (<div className='flexCenter backgroundText'><Typography variant='subtitle1'>[Custom event]</Typography></div>)
    let actionDescription = (<div className='flexCenter'><Typography variant='subtitle2'>?</Typography></div>);
    let actionName = 'Run a server action';

    //Use the action renderer for this event's action type
    if (mEvent.actionType === 'Show a graphic') {
        actionName = 'Play a graphic';
        let waitTime = null;
        let outEvent = null;
        if (mEvent.logicType === 'Player' && mEvent.logic.targetPlayerEvent === 'inbetween' && mEvent.logic.eventOffsetSecs !== 0) {
            let waitSeconds = mEvent.logic.eventOffsetSecs;
            waitTime = (
                <div style={{ alignItems: 'center' }}>
                    <Typography variant='subtitle2'>Pause {waitSeconds} second{waitSeconds !== 1 ? 's' : ''}</Typography>
                </div>
            );
            outEvent = (
                <div style={{ alignItems: 'center' }}>
                    <DoubleArrowIcon style={{ transform: 'scaleX(-1)' }} />
                    <Typography variant='subtitle2'>{mEvent.action.targetLayerName}</Typography>
                </div>
            );
        }

        actionDescription = (
            <div className='playerEventDescription'>
                <div style={{ alignItems: 'center' }}>
                    <DoubleArrowIcon />
                    <Typography variant='subtitle2'>{mEvent.action.targetLayerName}</Typography>
                </div>
                {waitTime}
                {outEvent}
            </div>
        );
    }

    //Use the description renderer for this type of event
    if (mEvent.logicType === 'Player') {
        let relTimeQualifier = 'Inbetween the blocks';
        if (mEvent.logic.targetPlayerEvent === 'Start of block') {
            if (mEvent.logic.eventOffsetSecs === 0) {
                relTimeQualifier = 'At the start'
            } else {
                relTimeQualifier = mEvent.logic.eventOffsetSecs + 's after the start'
            }
        } else if (mEvent.logic.targetPlayerEvent === 'End of block') {
            if (mEvent.logic.eventOffsetSecs === 0) {
                relTimeQualifier = 'At the end'
            } else {
                relTimeQualifier = mEvent.logic.eventOffsetSecs + 's before the end'
            }
        }
        eventDescription = (
            <div className='playerEventDescription'>
                <div>
                    <PlayCircleOutlineIcon className='playerEventIcon' />
                    <Typography>
                        Every {mEvent.logic.frequency === 1 ? '' : mEvent.logic.frequency + nth(mEvent.logic.frequency) + ' '}block
                    </Typography>
                </div>
                <div>
                    <AlarmIcon className='playerEventIcon' />
                    <Typography>{relTimeQualifier}</Typography>
                </div>
                <div>
                    <BoltIcon className='playerEventIcon' />
                    <div style={{ width: '100%' }}>
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
        bodyStyle = { userSelect: 'none', opacity: 0.5 };
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
                <IconButton size='small' onClick={props.onEditClicked}>
                    <EditIcon />
                </IconButton>
                <Typography variant='subtitle1' className='backgroundText' noWrap>{eventTypeText}</Typography>
                <IconButton size='small' onClick={props.onDeleteClicked}>
                    <DeleteIcon />
                </IconButton>
            </div>
        </Card>
    );
}