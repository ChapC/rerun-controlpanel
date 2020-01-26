import React from 'react';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import moment from 'moment';
import './Schedule.css';

export function Schedule(props) {
    let blockStartTime = moment(props.startTime);

    
    const onBlockDelete = (index) => {
        let targetBlockId = props.items[index].id;
        const newItemsList = Array.from(props.items); //Clone the current item list
        newItemsList.splice(index, 1);

        props.onListUpdate(newItemsList, {contentBlockId: targetBlockId, fromIndex: index, toIndex: -1});
    }

    let listItems = props.items.map((contentBlock, listIndex) => {
        //Convert our contentBlocks into ScheduleListItems
        let listItem = ( <ScheduleListItem media={contentBlock.media} id={contentBlock.id} 
                status={contentBlock.status} startTime={blockStartTime}
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
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={'schedule'}>
                    {provided => (
                        <div className='listContainer' {...provided.droppableProps} ref={provided.innerRef} style={{...props.style}}>
                            {listItems}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
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
                    <div className='listItemHandle' {...provided.dragHandleProps}>
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
                        <IconButton size='small'>
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
    return (
        <div className='mediaStatus' style={{backgroundColor: color}}>
            <Typography className='mediaStatusText' variant="caption" style={{fontWeight: 600}}>{props.status}</Typography>
        </div>
    )
}