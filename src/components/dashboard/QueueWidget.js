import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, Typography, IconButton, CircularProgress } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import moment from 'moment';
import FullscreenModal from '../FullscreenModal';
import { ContentBlockEditor } from '../editors/ContentBlockEditor';
import './QueueWidget.css';
import EditorTargetProvider from '../forms/EditorTargetProvider';

let queueListener, playingListener;
let forceUpdateCounter = 1;
export default function QueueWidget(props) {
    //Player state
    const [currentBlockFinishTime, setCurrentBlockFinishTime] = useState(moment());
    const [blockQueue, setBlockQueue] = useState(null);
    //ContentBlock editor doodads
    const [showContentBlockEditor, setShowContentBlockEditor] = useState(false);
    const [editTargetProvider, setEditTargetProvider] = useState({});
    const [contentBlockEditTarget, setContentBlockEditTarget] = useState(contentBlockTemplate);
    const [updateForceBadThing, setUpdateForceBadThing] = useState(0);

    //Server data fetching
    const updateCurrentBlockFinish = (playingBlocks) => {
        let msLeft = playingBlocks[0].media.durationMs - playingBlocks[0].progressMs;
        setCurrentBlockFinishTime(moment().add(msLeft, 'milliseconds'));
    }

    useEffect(() => {
        if (blockQueue == null) {
            props.server.sendRequest('getQueue').then(setBlockQueue).catch(error => console.error('Failed to fetch queue', error));
            queueListener = props.server.onAlert('playerQueueChanged', setBlockQueue);
            //We also need the current playing block so we can figure out what time the next queued block will begin
            props.server.sendRequest('getPlayingBlocks').then(updateCurrentBlockFinish).catch(error => console.error('Failed to fetch player state', error));
            playingListener = props.server.onAlert('playerStateChanged', updateCurrentBlockFinish);
        }
    }, [blockQueue, props.server]);

    useEffect(() => () => {
        props.server.offAlert(queueListener);
        props.server.offAlert(playingListener);
    }, []);

    //User actions

    const onBlockDelete = (index) => {
        //Update the local list
        let targetBlockId = blockQueue[index].queuedId;
        const newItemsList = Array.from(blockQueue); //Clone the current item list
        newItemsList.splice(index, 1);
        setBlockQueue(newItemsList);

        //Ask the server to delete it
        props.server.sendRequest('queueChange', { queueIdToMove: targetBlockId, queueIdTarget: -1, placeBefore: false }).catch(err => console.error('Block delete request failed', err));
    }

    const onBlockEditorSubmit = () => {
        props.server.sendRequest('updateContentBlock', { block: contentBlockEditTarget }).then(() => {
            setShowContentBlockEditor(false);
        }).catch(error => {
            console.error('Content block update failed', error);
            alert('Error from server:\n' + error.message);
        });
    }

    const showBlockEditor = (contentBlock) => {
        console.info(contentBlock)
        let provider = new EditorTargetProvider(contentBlock, (updated) => {
            setContentBlockEditTarget(updated);
            setUpdateForceBadThing(forceUpdateCounter++); //HACK - React won't re-render without force-updating this. Help!
        }, props.server);
        setEditTargetProvider(provider);
        setContentBlockEditTarget(provider.editorTarget);
        setShowContentBlockEditor(true);
    }

    //List handling

    //Convert the contentBlocks into ScheduleListItems
    let listItems;
    let blockStartTime = moment(currentBlockFinishTime); //Used to display a start time for each queued block
    if (blockQueue) {
        listItems = blockQueue.map((contentBlock, listIndex) => {
            let listItem = (
                <QueuedWidgetItem media={contentBlock.media} id={contentBlock.queuedId} colour={contentBlock.colour}
                    status={contentBlock.mediaStatus} startTime={blockStartTime} onEditClicked={() => showBlockEditor(contentBlock)}
                    index={listIndex} key={contentBlock.queuedId} onDeleteClicked={() => onBlockDelete(listIndex)} />
            );

            //Increase startTime by the duration of this media
            blockStartTime = moment(blockStartTime).add(contentBlock.media.durationMs, 'milliseconds');

            return listItem;
        });
    }

    const onDragEnd = (result) => {
        const { destination, source } = result;

        if (!destination) {
            //The draggable was dropped outside the list
            return;
        }

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            //Nothing changed - the user dropped the item in the same spot it was dragged from
            return;
        }

        //The list was reordered

        const newItemsList = Array.from(blockQueue); //Clone the current item list
        let sourceBlock = blockQueue[source.index];
        let destinationBlock = blockQueue[destination.index];
        newItemsList.splice(source.index, 1); //Remove the draggable from its original index
        newItemsList.splice(destination.index, 0, sourceBlock); //Insert the draggable into its new index

        //Update the local list
        setBlockQueue(newItemsList);

        //Send the change to the server
        let changeRequest = { queueIdToMove: sourceBlock.queuedId, queueIdTarget: destinationBlock.queuedId, placeBefore: destination.index < source.index };
        
        props.server.sendRequest('queueChange', changeRequest).catch((err) => {
            console.error('Schedule change rejected', err);
            //Our copy of the queue is probably outdated!!!!!!!
            props.server.sendRequest('getQueue').then(setBlockQueue).catch(error => console.error('Failed to fetch queue', error));
        });
    }

    if (blockQueue == null) {
        return (
            <div className='listContainer centerFlex' style={{ ...props.style, flexDirection: 'column' }}>
                <CircularProgress />
                <Typography variant="subtitle1">Fetching queue</Typography>
            </div>
        );
    }

    if (blockQueue.length > 0) {
        return (
            <div>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId={'schedule'}>
                        {provided => (
                            <div className='listContainer' {...provided.droppableProps} ref={provided.innerRef} style={{ ...props.style }}>
                                {listItems}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <FullscreenModal title={'Edit content block'} onSubmit={onBlockEditorSubmit}
                    show={showContentBlockEditor} onCancel={() => setShowContentBlockEditor(false)}>
                    <ContentBlockEditor block={contentBlockEditTarget} onPropertyChange={editTargetProvider.onPropertyChange} />
                </FullscreenModal>
            </div>
        );
    } else {
        return (
            <div className='listContainer centerFlex' style={{ ...props.style }}>
                <Typography variant="subtitle1">No queued content blocks</Typography>
            </div>
        )
    }
}

function QueuedWidgetItem(props) {
    let startTimeNumbers = '?:??';
    let startTimeAMPM = '';

    if (props.startTime != null) {
        startTimeNumbers = props.startTime.format('h:mm');
        startTimeAMPM = props.startTime.format('a');
    }

    return (
        <Draggable draggableId={'draggable' + props.id} index={props.index}>
            {provided => (
                <Card className='listItem' {...provided.draggableProps} ref={provided.innerRef}>
                    <div className='listItemHandle' {...provided.dragHandleProps} style={{ backgroundColor: props.colour }}>
                        <div style={{ display: 'flex' }}>
                            <Typography variant="h6" className='scheduleTime'>{startTimeNumbers}</Typography>
                            <Typography variant="subtitle1" className='scheduleTime'>{startTimeAMPM}</Typography>
                        </div>
                    </div>

                    <div className='listItemMiddle'>
                        <Typography variant="h6" className='scheduleItemName' noWrap>{props.media.name}</Typography>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" className='scheduleItemSub'>{props.media.type}</Typography>
                            <MediaStatusIndicator status={props.status} />
                        </div>
                    </div>

                    <div className='listItemButtons'>
                        <IconButton size='small' onClick={props.onEditClicked}>
                            <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton size='small' onClick={props.onDeleteClicked}>
                            <DeleteIcon fontSize='small' />
                        </IconButton>
                    </div>
                </Card>
            )}
        </Draggable>
    )
}

function MediaStatusIndicator(props) {
    let color = '';
    if (props.status === 'Ready') {
        color = '#25cc49';
    } else if (props.status === 'Pending') {
        color = '#ffd342';
    } else if (props.status === 'Offline') {
        color = '#ff4242'
    }

    let opacity = 1;
    if (props.status === 'Untracked') {
        opacity = 0;
    }

    return (
        <div className='mediaStatus' style={{ backgroundColor: color, opacity: opacity }}>
            <Typography className='mediaStatusText' variant="caption" style={{ fontWeight: 600 }}>{props.status}</Typography>
        </div>
    )
}

const contentBlockTemplate = {
    media: {
        name: '', type: '', location: { path: '' }
    },
    playbackConfig: {
        trimStartSec: 0, trimEndSec: 0
    }
}