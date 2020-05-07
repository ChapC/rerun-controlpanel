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
import EventNoteIcon from '@material-ui/icons/EventNote';

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
    if (targetEvent.event && targetEvent.event.logic && targetEvent.event.logic.value.fromPosition) {
        if (targetEvent.event.logic.value.fromPosition.value === "Start of block") {
            eventOffsetTitle = "Seconds after start";
        } else if (targetEvent.event.logic.value.fromPosition.value === "End of block") {
            eventOffsetTitle = "Seconds before end";
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
            server.sendRequest('getEvents').then((events) => {
                setEventsList(eventListToValueList(events));
                setEventsFormList(events);
            }).catch(error => {
                console.error('Failed to fetch events:', error);
            });
        }

        if (eventOutline == null) {
            //Grab the outline for a UserEvent object from the server
            setEventOutline({});
            server.sendRequest('getEventOutline').then((eventOutline) => {
                setEventOutline(eventOutline);
            });
        }

        const listener = server.onAlert('setEventList', (newEventList) => {
            setEventsList(eventListToValueList(newEventList));
            setEventsFormList(newEventList);
        });

        return () => server.offAlert(listener);
    });

    const onSetEventEnabled = (eventId, isEnabled) => {
        server.sendRequest('setEventEnabled', { eventId: eventId, enabled: isEnabled })
            .catch((error) => console.error('Failed to set event enabled: ', error));
    }

    const deleteEvent = (eventId) => {
        server.sendRequest('deleteEvent', { eventId: eventId })
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
            server.sendRequest('getEventLogicOutline', {eventType: newValue}).then((logicOutline) => {
                editorTarget.event.logic.value = formOutlineToProperties(logicOutline);
                console.info(editorTarget)
                setEditorTarget(editorTarget);
            });
        } else if (changedProperty === 'actionType') {
            server.sendRequest('getEventActionOutline', {actionType: newValue}).then((actionOutline) => {
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
            server.sendRequest('createEvent', editorTarget.event).then(() => setShowEditor(false));
        } else {
            server.sendRequest('updateEvent', { eventId: editorTarget.id, newEvent: editorTarget.event }).then(() => {
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

const logicDescriptionRenderers = {
    'During a block': (e) => <InBlockAction event={e} />
}

function InBlockAction(props) {
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

function EventCard(props) {
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
                    <div style={{width: '100%', display: 'flex', alignItems: 'center'}}>
                        <div className='eventCardSectionIcon'>
                            <EventNoteIcon />
                        </div>
                        <Typography variant='h5' className='eventCardSectionTitle'>During a block</Typography>
                    </div>
                    <div className='eventCardSection'>
                        <div className='eventCardSectionBar'></div>
                        <div className='eventCardDescriptionContainer'>
                            {logicDescription}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{width: '100%', display: 'flex', alignItems: 'center'}}>
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