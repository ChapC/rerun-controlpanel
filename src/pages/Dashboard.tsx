import React from 'react';
import './Dashboard.css';
import { Grid, Card, Typography } from '@material-ui/core';
import QueueWidget from '../components/dashboard/QueueWidget';
import OnScreenNowWidget from '../components/dashboard/OnScreenNowWidget';
import StreamMonitorWidget from '../components/dashboard/StreamMonitorWidget';
import { WSConnection } from '../helpers/WebsocketConnection';
import Alert from '../helpers/Alerts';

type DashboardProps = { server: WSConnection, alerts: Alert[] };

export default function Dashboard(props: DashboardProps) {
  return (
    <div>
      <Grid container justify='space-evenly' style={{ width: '100%' }}>

        <Grid item xs={12} sm={12} md={12} className='dashGridItem'>
          <Card className='dashLargeCard'>
            <Typography variant="h5" className='dashCardTitle'>On screen</Typography>
            <OnScreenNowWidget server={props.server} />
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} className='dashGridItem'>
          <Card className='dashSmallCard'>
            <Typography variant="h5" className='dashCardTitle'>Stream</Typography>
            <StreamMonitorWidget server={props.server} />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} className='dashGridItem'>
          <Card className='dashSmallCard'>
            <Typography variant="h5" className='dashCardTitle'>System</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4} className='dashGridItem'>
          <Card className='dashSmallCard'>
            <Typography variant="h5" className='dashCardTitle'>Alerts</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={12} md={12} className='dashGridItem'>
          <Card className='dashLargeCard'>
            <Typography variant="h5" className='dashCardTitle'>Queue</Typography>
            <QueueWidget server={props.server} />
          </Card>
        </Grid>
        
      </Grid>
    </div>
  );
}