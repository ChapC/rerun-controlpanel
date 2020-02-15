import React, { useState, useEffect } from 'react';
import './ContentSourcesPage.css';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import Card from '@material-ui/core/Card';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import IconButton from '@material-ui/core/IconButton';
import ContentSourceEditor from '../ContentSourceEditor';
import FullscreenModal from '../FullscreenModal';

const emptyContentSource = {
    name: 'New content source'
}

export function ContentSourcesPage(props) {
    const server = props.server;
    const [contentSources, setContentSources] = useState(null);

    useEffect(() => {
        const newSourcesListener = server.addMessageListener('setContentSources', (newContentSources) => setContentSources(newContentSources));

        if (contentSources == null) {
            server.request('getContentSources').then((sources) => {
                console.dir(sources);
                setContentSources(sources);
            });
        }

        return (() => {
            server.removeMessageListener(newSourcesListener);
        });
    });

    let sourceList; 
    if (contentSources != null) {
        sourceList = contentSources.map((cs) => (<ContentSourceItem source={cs} key={cs.id} server={props.server} />));
    }

    return (
        <div>
            <div>
                <div className='sectionHeader'>
                    <Typography variant='h6'>Automatic content pool</Typography>
                    <Divider />
                </div>

                <div style={{height: 200, backgroundColor: 'white'}}>

                </div>
            </div>
            <div>
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', marginTop: '10px' }}>
                    <Typography variant='h6' noWrap>All sources</Typography>
                    <Divider style={{ flex: 1, margin: '0 10px' }} />
                    <Button variant='outlined' size='small' startIcon={<AddIcon />}>New source</Button>
                </div>

                <div>
                    {sourceList}
                </div>
            </div>
        </div>
    );
}

export const friendlySourceTypes = {
    'LocalDirectory': 'Local folder'
}

function ContentSourceItem(props) {
    const [showEditor, setShowEditor] = useState(false);
    const [editTarget, setEditTarget] = useState(emptyContentSource);

    const openSourceEditor = () => {
        setEditTarget(JSON.parse(JSON.stringify(props.source)));
        setShowEditor(true);
    }

    const onSourceSubmit = () => {
        props.server.request('updateContentSource', { sourceId: props.source.id, newSource: editTarget }).then(() => {
            setShowEditor(false);
        }).catch(error => {
            console.error('Content source update failed', error);
            alert('Error from server:\n' + error.message);
        });
    }

    const onSourceEditChange = (changedProperty, newValue) => {
        //Changedproperty supports setting object members with the syntax 'object.child.targetproperty'
        let objectNames = changedProperty.split('.');
        let targetPropertyName = objectNames.splice(-1, 1)[0];
  
        let modifiedSource = Object.assign({}, editTarget);
  
        let targetObject = modifiedSource;
        for (let objectName of objectNames) {
            targetObject = targetObject[objectName];
        }
        targetObject[targetPropertyName] = newValue;
  
        setEditTarget(modifiedSource);
    }

    let sourceType = friendlySourceTypes[props.source.type];
    if (sourceType == null) {
        sourceType = props.source.type;
    }

    let alertItems = [];
    for (let alert of props.source.alerts) {
        let icon = <ErrorIcon style={{color: '#ed2c1f'}} />
        let color = '#ed2c1f';
        if (alert.severity === 'Warning') {
            icon = <WarningIcon style={{color: '#f5ce42'}} />
            color = '#f5ce42';
        }

        alertItems.push(
            <div className='csAlert' key={alert.key}>
                {icon}
                <div className='csAlertBox' style={{border: '1px solid' + color}}>
                    <Typography variant='h6' style={{color: color}}>{alert.title}</Typography>
                    <Typography variant='subtitle1'>{alert.description}</Typography>
                </div>
            </div>
        );
    }

    return (
        <Card className='csCard'>
            <div className='csContainer'>
                <div>
                    <Typography variant='h5'>{props.source.name}</Typography>
                    <Typography variant='subtitle1'>{sourceType}</Typography>
                </div>
                <div className='csEditDelete'>
                    <IconButton size='small' onClick={openSourceEditor}>
                        <EditIcon fontSize='small' />
                    </IconButton>
                    <IconButton size='small' onClick={props.onDelete}>
                        <DeleteIcon fontSize='small' />
                    </IconButton>
                </div>
            </div>
            <div>
                {alertItems}
            </div>

            <FullscreenModal title={'Edit content source'} onSubmit={onSourceSubmit}
                show={showEditor} onCancel={() => setShowEditor(false)}>
                <ContentSourceEditor source={editTarget} setProperty={onSourceEditChange} />
            </FullscreenModal>
        </Card>
    );
}
