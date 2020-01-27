import React, { useState } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import './EventsPage.css';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Switch from '@material-ui/core/Switch';

const userStyles = makeStyles(theme => ({
    eventTitle: {
        fontSize: '1.2em'
    }
}));

export function EventsPage(props) {
    const server = props.server;
    const [fetchedEvents, setFetchedEvents] = useState(false);
    const [eventsList, setEventsList] = useState([]);

    if (!fetchedEvents) {
        setFetchedEvents(true);
        server.request('getEvents').then((events) => {
            console.dir(events);
            setEventsList(events);
        }).catch(error => {
            console.error('Failed to fetch events:', error);
        });
    }

    let cards = eventsList.map((tEvent, index) => (
        <EventCard event={tEvent.event} enabled={tEvent.enabled} key={'eventcard' + index}/>
    ))

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

function EventCard(props) {
    const classes = userStyles();
    const mEvent = props.event;

    return (
        <Card className='eventCardRoot'>
            <div className='eventCardHeader'>
                <Typography variant='h5' className={classes.eventTitle} noWrap>{mEvent.name}</Typography>
                <PurpleSwitch size='small' checked={props.enabled} onChange={null} inputProps={{ 'aria-label': 'event enabled' }} />
            </div>
            <div className='eventCardBody'>

            </div>
            <div className='eventCardFooter'>

            </div>
        </Card>
    );
}