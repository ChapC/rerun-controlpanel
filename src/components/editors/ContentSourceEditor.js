import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import './ContentSourceEditor.css';
import { Typography } from '@material-ui/core';
import { friendlySourceTypes } from '../../pages/ContentSourcesPage';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';

export default function ContentSourceEditor(props) {
    let sourceType = friendlySourceTypes[props.source.type];
    if (sourceType == null) {
        sourceType = props.source.type;
    }

    let propertyEditor = null;
    if (props.source.type === 'LocalDirectory') {
        propertyEditor = <LocalDirectoryProperties setProperty={props.setProperty} source={props.source} />
    }

    let sourceTypeDisplay = (
        <div className='csEditorType'>
            <Typography variant='subtitle1'>Source type:</Typography>
            <Typography variant='subtitle2'>{sourceType}</Typography>
        </div>
    );

    if (props.creatingNew) {
        //Working on a new content source
        let sourceTypeOptions = [];

        for (let sourceTypeKey in friendlySourceTypes) {
            sourceTypeOptions.push(<MenuItem key={sourceTypeKey} value={sourceTypeKey}>{friendlySourceTypes[sourceTypeKey]}</MenuItem>);
        }

        sourceTypeDisplay = (
            <FormControl variant='filled' className='fullWidthField'>
                <InputLabel>Source type</InputLabel>
                <Select value={props.source.type}
                    onChange={(ev) => props.setProperty('type', ev.target.value)}>
                    {sourceTypeOptions}
                </Select>
            </FormControl>
        );
    }

    return (
        <div className='csEditorRoot'>
            <div className='csEditorBody'>
                {sourceTypeDisplay}
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
    const directory = props.source.directory ? props.source.directory : '';
    const shuffle = props.source.shuffle != null ? props.source.shuffle : true;

    return (
        <div>
            <FormControl className='fullWidthField'>
                <TextField label='Directory' onChange={(ev) => props.setProperty('directory', ev.target.value)}
                    variant='filled' value={directory} />
            </FormControl>
            <FormControlLabel label='Shuffle videos' onChange={(ev) => props.setProperty('shuffle', ev.target.checked)}
                control={<Checkbox checked={shuffle} />} />
        </div>
    );
}

function YoutubeChannelProperties(props) {
    return (
        <div>
            
        </div>
    );
}