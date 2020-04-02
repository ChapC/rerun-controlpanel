import React from 'react';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import InfoIcon from '@material-ui/icons/Info';
import ErrorIcon from '@material-ui/icons/Error';
import { Card, Typography } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import './AlertContainer.css';

const severityMap = {
    'Error': <ErrorIcon style={{fill: '#f72828'}} className='alertIcon' />, 
    'Warning': <WarningIcon style={{fill: '#ffd12b'}} className='alertIcon' />,
    'InfoIcon': <InfoIcon style={{fill: '#147ce3'}} className='alertIcon' />
}

//Displays a list of alerts (matches AlertContainer on the server)
export default function AlertContainer(props) {
    let content;

    if (props.alerts == null) { //Alerts not fetched yet
        if (props.showLoader) {
            //Show a loading spinner
            content = (
                <div style={{display: 'flex', justifyContent: 'center', alignItems:'center', padding: '10px', boxSizing:'border-box'}}>
                    <CircularProgress />
                </div>
            )
        }
    } else {
        if (props.alerts.length > 0) {
            //Display all the alerts as a list
            content = [];
            props.alerts.forEach(alert => {
                content.push(
                    <div className='alertIconText' key={alert.key}>
                        <div>
                            {severityMap[alert.severity]}
                            <Typography variant='h6'>{alert.title}</Typography>                          
                        </div>
                          
                        <Typography className='alertDesc' variant='subtitle1'>{alert.description}</Typography>
                    </div>
                );
            });
        } else { //Alerts fetched, but there aren't any
            if (!props.hideWhenEmpty) {
                content = (
                    <div className='alertAllGood'>
                        <CheckCircleIcon style={{fill: '#30ba3c'}} className='alertIcon'/>
                        <Typography>All systems go 🚀</Typography>
                    </div>
                );
            }
        }
    }

    return (
        <Card className='alertContainerRoot'>
            {content}
        </Card>
    );
}