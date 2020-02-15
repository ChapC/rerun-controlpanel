import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import './ContentSourceEditor.css';
import { Typography } from '@material-ui/core';
import { friendlySourceTypes } from './pages/ContentSourcesPage';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export default function ContentSourceEditor(props) {
    let sourceType = friendlySourceTypes[props.source.type];
    if (sourceType == null) {
        sourceType = props.source.type;
    }

    let propertyEditor = null;
    if (props.source.type === 'LocalDirectory') {
        propertyEditor = <LocalDirectoryProperties setProperty={props.setProperty} source={props.source} />
    }

    return (
        <div className='csEditorRoot'>
            <div className='csEditorBody'>
                <div className='csEditorType'>
                    <Typography variant='subtitle1'>Source type:</Typography>
                    <Typography variant='subtitle2'>{sourceType}</Typography>
                </div>
                <FormControl className='fullWidthField'>
                    <TextField label='Name' onChange={(ev) => {props.setProperty('name', ev.target.value)}}
                        variant='filled' value={props.source.name} />
                </FormControl>

                {propertyEditor}
            </div>
        </div>
    );
}

function LocalDirectoryProperties(props) {
    return (
        <div>
            <FormControl className='fullWidthField'>
                <TextField label='Directory' onChange={(ev) => props.setProperty('directory', ev.target.value)}
                    variant='filled' value={props.source.directory} />
            </FormControl>
            <FormControlLabel label='Shuffle videos' onChange={(ev) => props.setProperty('shuffle', ev.target.checked)}
                control={<Checkbox checked={props.source.shuffle} />} />
        </div>
    );
}

function YoutubeChannelProperties(props) {
    return (
        <div>
            
        </div>
    );
}