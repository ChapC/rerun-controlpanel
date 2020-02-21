import React, {useState} from 'react';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import moment from 'moment';
import FullscreenModal from './FullscreenModal';
import { ContentBlockEditor } from './editors/ContentBlockEditor';
import './Schedule.css';

const contentBlockTemplate = {
    media: {
      name: '', type: '', location: {path: ''}
    },
    playbackConfig: {
      trimStartSec: 0, trimEndSec: 0
    }
}

export function Schedule(props) {
    const [showContentBlockEditor, setShowContentBlockEditor] = useState(false);
    const [contentBlockEditTarget, setContentBlockEditTarget] = useState(contentBlockTemplate);

    const onEditBlockChange = (changedProperty, newValue) => {
      //Changedproperty supports setting object members with the syntax 'object.child.targetproperty'
      let objectNames = changedProperty.split('.');
      let targetPropertyName = objectNames.splice(-1, 1)[0];

      let modifiedBlock = Object.assign({}, contentBlockEditTarget);

      let targetObject = modifiedBlock;
      for (let objectName of objectNames) {
          targetObject = targetObject[objectName];
      }
      targetObject[targetPropertyName] = newValue;

      setContentBlockEditTarget(modifiedBlock);
    }

    let blockStartTime = moment(props.startTime);
    
    const onBlockDelete = (index) => {
        let targetBlockId = props.items[index].id;
        const newItemsList = Array.from(props.items); //Clone the current item list
        newItemsList.splice(index, 1);

        props.onListUpdate(newItemsList, {contentBlockId: targetBlockId, fromIndex: index, toIndex: -1});
    }

    const onBlockEditorSubmit = () => {
        props.server.request('updateContentBlock', {block: contentBlockEditTarget}).then(() => {
            setShowContentBlockEditor(false);
        }).catch(error => {
            console.error('Content block update failed', error);
            alert('Error from server:\n' + error.message);
        });
    }

    const showBlockEditor = (contentBlock) => {
        setContentBlockEditTarget(JSON.parse(JSON.stringify(contentBlock)));
        setShowContentBlockEditor(true);
    }

    //Convert the contentBlocks into ScheduleListItems
    let listItems = props.items.map((contentBlock, listIndex) => {
        let listItem = ( <ScheduleListItem media={contentBlock.media} id={contentBlock.id} colour={contentBlock.colour}
                status={contentBlock.mediaStatus} startTime={blockStartTime} onEditClicked={() => showBlockEditor(contentBlock)}
                index={listIndex} key={contentBlock.id} onDeleteClicked={() => onBlockDelete(listIndex)}/>
        );
                
        //Increase startTime by the duration of this media
        blockStartTime = moment(blockStartTime).add(contentBlock.media.durationMs, 'milliseconds');
        
        return listItem;
    });

    const onDragEnd = (result) => {
        const {destination, source} = result;

        if (!destination) {
            //The draggable was dropped outside the list
            return;
        }

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            //Nothing changed - the user dropped the item in the same spot it was dragged from
            return;
        }

        //The list was reordered

        const newItemsList = Array.from(props.items); //Clone the current item list
        let targetContentBlock = props.items[source.index];
        newItemsList.splice(source.index, 1); //Remove the draggable from its original index
        newItemsList.splice(destination.index, 0, targetContentBlock); //Insert the draggable into its new index

        props.onListUpdate(newItemsList, {contentBlockId: targetContentBlock.id, fromIndex: source.index, toIndex: destination.index});
    }

    if (props.items != null && props.items.length > 0) {
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
                    <ContentBlockEditor block={contentBlockEditTarget} onPropertyChange={onEditBlockChange} />
                </FullscreenModal>
            </div>
        )
    } else {
        return (
            <div className='listContainer centerFlex' style={{...props.style}}>
                <Typography variant="subtitle1">No scheduled content blocks</Typography>
            </div>
        )
    }
}

export function ScheduleListItem(props) {
    let startTimeNumbers = '?:??';
    let startTimeAMPM = ''

    if (props.startTime != null) {
        startTimeNumbers = props.startTime.format('h:mm');
        startTimeAMPM = props.startTime.format('a');
    }

      return (
          <Draggable draggableId={'draggable' + props.id} index={props.index}>
              {provided => (
                <Card className='listItem' {...provided.draggableProps} ref={provided.innerRef}>
                    <div className='listItemHandle' {...provided.dragHandleProps} style={{backgroundColor: props.colour}}>
                        <div style={{display: 'flex'}}>
                            <Typography variant="h6" className='scheduleTime'>{startTimeNumbers}</Typography>
                            <Typography variant="subtitle1" className='scheduleTime'>{startTimeAMPM}</Typography>
                        </div>
                    </div>

                    <div className='listItemMiddle'>
                        <Typography variant="h6" className='scheduleItemName' noWrap>{props.media.name}</Typography>
                        <div style={{display: 'flex', alignItems: 'center'}}>
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
        <div className='mediaStatus' style={{backgroundColor: color, opacity: opacity}}>
            <Typography className='mediaStatusText' variant="caption" style={{fontWeight: 600}}>{props.status}</Typography>
        </div>
    )
}