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
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import AddIcon from '@material-ui/icons/Add';
import FormControl from '@material-ui/core/FormControl';
import Divider from '@material-ui/core/Divider';
import Select from '@material-ui/core/Select';
import FormGroup from '@material-ui/core/FormGroup';


const userStyles = makeStyles(theme => ({
    eventTitle: {
        fontSize: '1.2em'
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    }
}));

const defaultEvent = {
    event: {
        type: 'Player', targetPlayerEvent: 'start', eventOffset: 3000,
        frequency: 1, name: 'New event', action: {}
    }
};

export function EventsPage(props) {
    const server = props.server;
    const [eventsList, setEventsList] = useState(null);
    const [editorTarget, setEditorTarget] = useState(defaultEvent);
    const [showEditor, setShowEditor] = useState(false);
    const [creatingNewEvent, setCreatingNewEvent] = useState(false);

    useEffect(() => {
        if (eventsList == null) {
            server.request('getEvents').then((events) => {
                setEventsList(events);
                console.dir(events);
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

    const deleteEvent = (eventId) => {
        server.request('deleteEvent', {eventId: eventId})
            .catch((error) => console.error('Failed to delete event:', error));
    }

    const showEditDialog = (event) => {
        setEditorTarget(event);
        setCreatingNewEvent(false);
        setShowEditor(true);
    }

    const showNewDialog = () => {
        setEditorTarget(defaultEvent);
        setCreatingNewEvent(true);
        setShowEditor(true);
    }

    let cards = null;
    if (eventsList != null) {
        if (eventsList.length == 0) {
            cards = (
                <div className='centerFlex' style={{marginTop: '10px'}}>
                    <Typography>No events</Typography>
                </div>
            );
        } else {
            cards = eventsList.map((tEvent, index) => (
                <EventCard event={tEvent.event} enabled={tEvent.enabled} 
                    onSetEnabled={(enabled) => onSetEventEnabled(tEvent.id, enabled)} 
                    onEditClicked={() => showEditDialog(tEvent)}
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
        targetObject[targetPropertyName] = newValue;

        let eventContainer = {
            id: editorTarget.id, enabled: editorTarget.enabled,
            event: modifiedEvent
        }

        setEditorTarget(eventContainer);
    }

    const eventEditorSubmit = () => {
        if (creatingNewEvent) {
            server.request('createEvent', editorTarget.event).then(() => setShowEditor(false));
        } else {
            //Submit the current editorTarget
            server.request('updateEvent', {eventId: editorTarget.id, newEvent: editorTarget.event}).then(() => {
                setShowEditor(false);
            });
        }
    }

    return (
        <div>
            <Button variant='outlined' startIcon={<AddIcon />} onClick={showNewDialog} style={{width: '100%'}}>Create event</Button>
            <div className='eventCardGrid'>
                {cards}
            </div>

            <Dialog open={showEditor} onClose={() => setShowEditor(false)}>
                <EventEditorDialog event={editorTarget.event} onPropertyChange={onEventEditorChange} 
                    isNewEvent={creatingNewEvent} onCancel={() => setShowEditor(false)} onSubmit={eventEditorSubmit}
                    server={server} />
            </Dialog>
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
        let outEvent = null;
        if (mEvent.type === 'Player' && mEvent.targetPlayerEvent === 'inbetween' && mEvent.action.eventOffset !== 0) {
            let waitSeconds = mEvent.eventOffset / 1000;
            waitTime = (
                <div style={{alignItems:'center'}}>
                    <Typography variant='subtitle2'>Pause {waitSeconds} second{waitSeconds !== 1 ? 's' : ''}</Typography>
                </div>
            );
            outEvent = (
                <div style={{alignItems:'center'}}>
                    <DoubleArrowIcon style={{transform: 'scaleX(-1)'}} />
                    <Typography variant='subtitle2'>{mEvent.action.targetLayer}</Typography>
                </div>
            );
        }

        actionDescription = (
            <div className='playerEventDescription'>
                <div style={{alignItems:'center'}}>
                    <DoubleArrowIcon />
                    <Typography variant='subtitle2'>{mEvent.action.targetLayer}</Typography>
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

function EventEditorDialog(props) {
    const classes = userStyles();
    const [graphicsPackages, setGraphicsPackages] = useState(null);

    useEffect(() => {
        if (graphicsPackages == null) {
            props.server.request('getGraphicsPackages').then((packages) => {
                setGraphicsPackages(packages);
            });
        }
    });

    const changeNumberProperty = (propertyName, newValue) => {
        if (!Number.isNaN(newValue)) {
            props.onPropertyChange(propertyName, newValue);
        }
    }

    //Properties that are unique to this type of event
    let specificEventProperties = null;

    if (props.event.type === 'Player') {        
        let eventOffsetLabel = 'Seconds after start';
        if (props.event.targetPlayerEvent === 'end') {
            eventOffsetLabel = 'Seconds before end';
        } else if (props.event.targetPlayerEvent === 'inbetween') {
            eventOffsetLabel = 'Inbetween pause seconds';
        }

        specificEventProperties = (
            <div style={{marginTop: '10px'}}>
                <Typography variant='subtitle2'>Event frequency</Typography>
                <div style={{display: 'flex', marginLeft:'10px', alignItems: 'center'}}>
                    <Typography>Every</Typography>
                    <FormControl margin='dense' className='smallSelect'>
                        <Select value={props.event.frequency} onChange={(ev) => {changeNumberProperty('frequency', ev.target.value)}}
                           variant='filled'>
                            <MenuItem value={1}>1</MenuItem>
                            <MenuItem value={2}>2</MenuItem>
                            <MenuItem value={3}>3</MenuItem>
                            <MenuItem value={4}>4</MenuItem>
                            <MenuItem value={5}>5</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography>block(s)</Typography>
                </div>

                <Typography variant='subtitle2'>Time</Typography>
                <div style={{display: 'flex', marginLeft:'10px', alignItems: 'center'}}>
                    <FormControl margin='dense'>
                        <InputLabel>Position</InputLabel>
                        <Select value={props.event.targetPlayerEvent} onChange={(ev) => {props.onPropertyChange('targetPlayerEvent', ev.target.value)}}
                           variant='filled'>
                            <MenuItem value={'start'}>Start of block</MenuItem>
                            <MenuItem value={'end'}>End of block</MenuItem>
                            <MenuItem value={'inbetween'}>Inbetween blocks</MenuItem>
                        </Select>
                    </FormControl>
                </div>

                <div style={{display: 'flex', marginLeft:'10px', alignItems: 'center'}}>
                    <FormControl>
                        <TextField variant='filled' label={eventOffsetLabel}
                          value={props.event.eventOffset / 1000} onChange={(ev) => {changeNumberProperty('eventOffset', ev.target.value * 1000)}} />
                    </FormControl>
                </div>
            </div>
        )
    }

    let actionProperties = null;
    if (props.event.action.type === 'GraphicEvent') {
        let graphicLayerMap = {}; //Maps layer name to GraphicLayer object
        let graphicLayerItems = [];
        let graphicLayersSelect = null;
        if (graphicsPackages != null) {
            //Loop through each layer in each package
            for (let gPackage of graphicsPackages) {
                for (let layer of gPackage.layers) {
                    graphicLayerItems.push(<MenuItem key={layer.name} value={layer.name}>{layer.name}</MenuItem>);
                    graphicLayerMap[layer.name] = layer;
                }
            }

            const onLayerChanged = (layerName) => {
                props.onPropertyChange('action.targetLayer', layerName);
                //If the layer has the duration for an 'in' animation defined, use that as the GraphicAction's animInTime
                if (graphicLayerMap[layerName] && graphicLayerMap[layerName].animationTimings) {
                    let inTime = graphicLayerMap[layerName].animationTimings.in;
                    if (inTime != undefined) {
                        props.onPropertyChange('action.animInTime', inTime);
                    }
                }
            }

            //This will need to be changed when the server allows multiple active packages to be selected
            graphicLayersSelect = (
                <FormControl style={{marginTop: '10px'}}>
                    <InputLabel>Target layer</InputLabel>
                    <Select value={props.event.action.targetLayer ? props.event.action.targetLayer : 'none'} onChange={(ev) => onLayerChanged(ev.target.value)}
                        variant='filled'>
                            <MenuItem value='none'>(None)</MenuItem>
                            {graphicLayerItems}
                    </Select>
                </FormControl>
            );
        }
        actionProperties = (
            <div>
                {graphicLayersSelect}
            </div>
        );
    }

    return (
        <div>
            <DialogTitle>{props.isNewEvent ? 'Create event' : 'Edit event'}</DialogTitle>
            <DialogContent className='eventEditorBody'>
                <FormGroup>
                    <FormControl>
                        <TextField label="Title" variant='filled' value={props.event.name} onChange={(ev) => {props.onPropertyChange('name', ev.target.value)}} />
                    </FormControl>

                    <div className='eventEditorSplit'>
                        <div style={{ flex: 1 }}>
                            <FormControl style={{ width: '100%' }}>
                                <InputLabel>Event type</InputLabel>
                                <Select value={props.event.type} onChange={(ev) => {props.onPropertyChange('type', ev.target.value)}} variant='filled'>
                                    <MenuItem value={'Player'}>Player</MenuItem>
                                    <MenuItem value={'Schedule'}>Schedule update</MenuItem>
                                    <MenuItem value={'HTTP'}>HTTP Request</MenuItem>
                                </Select>
                            </FormControl>

                            {specificEventProperties}
                        </div>

                        <div className='eventEditorDivider'>
                            <Divider orientation="vertical" />
                        </div>

                        <div style={{ flex: 1 }}>
                            <FormControl style={{ width: '100%' }}>
                                <InputLabel>Action</InputLabel>
                                <Select value={props.event.action.type ? props.event.action.type : ''} onChange={(ev) => {props.onPropertyChange('action.type', ev.target.value)}} variant='filled'>
                                    <MenuItem value={'GraphicEvent'}>Show graphic</MenuItem>
                                    <MenuItem value={'Webhook'}>Trigger webhook</MenuItem>
                                </Select>
                            </FormControl>

                            {actionProperties}
                        </div>
                    </div>
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button color="primary" onClick={props.onCancel}>Cancel</Button>
                <Button color="primary" onClick={props.onSubmit}>Save changes</Button>
            </DialogActions>
        </div>
    );
}