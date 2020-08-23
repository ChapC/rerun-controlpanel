import React, { useState, useEffect } from 'react';
import './EventsPage.css';
import Typography from '@material-ui/core/Typography';
import FullscreenModal from '../components/FullscreenModal';
import FormEditorContext, { formOutlineToProperties, validatedPropertiesToValues } from '../components/forms/FormEditorContext';
import FormProperty from '../components/forms/FormProperty';
import EditorTargetProvider from '../components/forms/EditorTargetProvider';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import EventCard from '../components/EventCard';

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

let fetchingEventsList = false;

export function EventsPage(props) {
    const server = props.server;
    const [eventOutline, setEventOutline] = useState(null); //The base outline of an event object, used when creating events from scratch
    const [eventsList, setEventsList] = useState(null); //Events converted from forms to just values
    const [eventsFormList, setEventsFormList] = useState([]); //Events as forms, as they come from the server
    //Event editor
    const [editorTargetProvider, setEditorTargetProvider] = useState({});
    const [editorTarget, setEditorTarget] = useState({}); //The event currently being worked on in the editor
    const [showEditor, setShowEditor] = useState(false);
    const [creatingNewEvent, setCreatingNewEvent] = useState(false);

    useEffect(() => {
        if (eventsList == null && !fetchingEventsList) {
            fetchingEventsList = true;
            server.sendRequest('getEvents').then((events) => {
                setEventsList(eventListToValueList(events));
                setEventsFormList(events);
                fetchingEventsList = false;
            }).catch(error => {
                console.error('Failed to fetch events:', error);
                fetchingEventsList = false;
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

    const showModifyEventEditor = (eventID) => {
        //Find the target event form in eventsFormList
        let targetEvent = null;
        for (let e of eventsFormList) {
            if (e.id == eventID) {
                targetEvent = e;
                break;
            }
        }

        //The EditorTarget class returns the event's properties (logic and action settings), but we want them wrapped in an actual Event object
        let onEditTargetChange = (changedEvent) => setEditorTarget({
            id: targetEvent.id, enabled: targetEvent.enabled, event: changedEvent
        });

        let targetProvider = new EditorTargetProvider(JSON.parse(JSON.stringify(targetEvent.event)), onEditTargetChange, server);

        setEditorTarget({ event: targetProvider.editorTarget });
        setEditorTargetProvider(targetProvider);
        setCreatingNewEvent(false);
        setShowEditor(true);
    }

    const showNewEventEditor = () => {

        let onEditTargetChange = (changedEvent) => setEditorTarget({ event: changedEvent });

        let targetProvider = new EditorTargetProvider(formOutlineToProperties(eventOutline), onEditTargetChange, server);

        setEditorTarget({ event: targetProvider.editorTarget });
        setEditorTargetProvider(targetProvider);
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
            cards = eventsList.map((tEvent) => (
                <EventCard event={tEvent.event} enabled={tEvent.enabled}
                    onSetEnabled={(enabled) => onSetEventEnabled(tEvent.id, enabled)}
                    onEditClicked={() => showModifyEventEditor(tEvent.id)}
                    onDeleteClicked={() => deleteEvent(tEvent.id)}
                    key={'eventcard' + tEvent.id} />
            ))
        }
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
                <FormEditorContext properties={editorTarget.event} onPropertyChange={editorTargetProvider.onPropertyChange} server={server}>
                    <FormProperty key='name' />
                    <FormProperty key='logicType' />
                    <FormProperty key='logic'>
                        {(properties) => {
                            //Return a different logic configuration component depending on the selected logicType
                            switch (editorTarget.event.logicType.value) {
                                case 'During a block':
                                    return DuringBlockLogic(properties);
                                default:
                                    return null; //The FormGroup will render a default editor
                            }
                        }}
                    </FormProperty>
                </FormEditorContext>
            </FullscreenModal>
        </div>
    );
}

//Custom event logic editors
const DuringBlockLogic = (properties) => (
    <>
        <Typography variant='subtitle1'>Timing</Typography>
        <div style={{ display: 'flex' }}>
            <FormProperty key='fromPosition' defaultValue={'Start of block'} style={{ marginRight: '15px' }} />
            <FormProperty key='eventOffsetSecs' label={properties.fromPosition === 'Start of block' ? 'Seconds after start' : 'Seconds before end'} />
        </div>
        <FormProperty key='frequency' />
    </>
)