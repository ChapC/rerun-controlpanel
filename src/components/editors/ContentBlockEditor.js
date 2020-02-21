import React from 'react';
import './ContentBlockEditor.css';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const colours = ['#282482', 'coral', '#f03232', 'limegreen', '#3382ff', '#f0e032', '#d332f0', '#ed4cc5'];

export function ContentBlockEditor(props) {
    let mediaProperties = null;
    if (props.block.media.type === 'Local video file') {
        mediaProperties = <LocalVideoProperties media={props.block.media} setProperty={props.onPropertyChange} />
    } else if (props.block.media.type === 'Youtube video') {
        mediaProperties = <YoutubeVideoProperties media={props.block.media} setProperty={props.onPropertyChange} />

    } else if (props.block.media.type === 'RTMP stream') {
        mediaProperties = <RTMPStreamProperties media={props.block.media} setProperty={props.onPropertyChange} />

    } else if (props.block.media.type === 'Rerun title graphic') {
        mediaProperties = <RerunGraphicProperties media={props.block.media} setProperty={props.onPropertyChange} />
    }

    return (
        <div className='blockEditRoot'>
            <div className='blockEditBody'>
                <Typography variant='subtitle1'>Block settings</Typography>
                <div className='blockEditSection'>
                    <div className='blockEditSectionLine'>
                        <Divider orientation='vertical' />
                    </div>
                    <div className='fullWidthField'>
                        <FormControl>
                            <TextField label='Title' onChange={(ev) => {props.onPropertyChange('media.name', ev.target.value)}}
                                variant='filled' value={props.block.media.name} />
                        </FormControl>
                        <div>
                            <Typography variant='subtitle2'>Colour</Typography>
                            <ColourSelector colours={colours} onSelect={(c) => props.onPropertyChange('colour', c)}
                                selected={props.block.colour} className='blockEditColSelect' />
                        </div>
                        <div>
                            <Typography variant='subtitle2'>Media trimming</Typography>
                            <div style={{display: 'flex'}}>
                                <FormControl>
                                    <TextField label='Start trim' onChange={(ev) => {props.onPropertyChange('playbackConfig.trimStartSec', ev.target.value)}}
                                        type='number' variant='filled' value={props.block.playbackConfig.trimStartSec} />
                                </FormControl>
                                <div style={{width: '10px'}}></div>
                                <FormControl>
                                    <TextField label='End trim' onChange={(ev) => {props.onPropertyChange('playbackConfig.trimEndSec', ev.target.value)}}
                                        type='number' variant='filled' value={props.block.playbackConfig.trimEndSec} />
                                </FormControl>
                            </div>
                        </div>
                    </div>
                </div>

                <Typography variant='subtitle1'>Media</Typography>
                <div className='blockEditSection'>
                    <div className='blockEditSectionLine'>
                        <Divider orientation='vertical' />
                    </div>
                    <div className='fullWidthField'>
                        <FormControl variant='filled'>
                            <InputLabel>Media type</InputLabel>
                            <Select value={props.block.media.type} onChange={(ev) => {props.onPropertyChange('media.type', ev.target.value)}}>
                                <MenuItem value='Local video file'>Local video file</MenuItem>
                                <MenuItem value='Youtube video'>Youtube video</MenuItem>
                                <MenuItem value='RTMP stream'>RTMP live stream</MenuItem>
                                <MenuItem value='Rerun title graphic'>Rerun graphic</MenuItem>
                            </Select>
                        </FormControl>

                        {mediaProperties}
                    </div>
                </div>
            </div>
        </div>
    )
}

function LocalVideoProperties(props) {
    return (
        <div className='fullWidthField'>
            <FormControl>
                <TextField label='File path' onChange={(ev) => {props.setProperty('media.location.path', ev.target.value)}}
                    variant='filled' value={props.media.location.path} />
            </FormControl>
        </div>
    );
}

function YoutubeVideoProperties(props) {
    const predownloadCheckChanged = (event) => {
        let type = event.target.checked ? 'Download buffer' : 'Web stream';
        props.setProperty('media.location.type', type);
    }

    let predownloadChecked = true;
    if (props.media.location.type && props.media.location.type !== 'Download buffer') {
        predownloadChecked = false;
    }

    return (
        <div className='fullWidthField'>
            <FormControl>
                <TextField label='Video URL' onChange={(ev) => {props.setProperty('media.location.path', ev.target.value)}}
                    variant='filled' value={props.media.location.path} />
            </FormControl>
            <FormControlLabel label='Pre-download video to disk' onChange={predownloadCheckChanged}
                control={<Checkbox checked={predownloadChecked} />} />
        </div>
    );
}

function RTMPStreamProperties(props) {
    return (
        <div>
            
        </div>
    );
}

function RerunGraphicProperties(props) {
    return (
        <div>
            
        </div>
    );
}

function ColourSelector(props) {
    let colourDots = [];

    for (let colour of props.colours) {
        colourDots.push(<ColourDot key={'colourDot' + colour} onClick={() => props.onSelect(colour)}
                        selected={props.selected === colour} colour={colour}/>);
    }

    return (
        <div className={props.className}>
            {colourDots}
        </div>
    );
}

function ColourDot(props) {
    let bgColour = '#cccccc';
    if (props.selected) {
        bgColour = 'white';
    }
    return (
        <div onClick={props.onClick} style={{height: '24px', width: '24px', backgroundColor: bgColour, borderRadius: '25px',
                     display: 'inline-flex', justifyContent: 'center', alignItems: 'center', cursor:'pointer', margin:'5px'}}>
            <div style={{height: '16px', width: '16px', backgroundColor: props.colour, borderRadius: '25px'}}></div>
        </div>
    )
}