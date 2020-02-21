import React from 'react';
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import ReactDOM from "react-dom";
import './FullscreenModal.css';

export default function FullscreenModal(props) {
    let containerStyle = {transform: 'translateY(100%)'};
    if (props.show) {
        containerStyle = {transform: 'translateY(0%)'}
    }

    const Modal = (
        <div className='fsRoot'>
            <div className='fsContainer' style={{...containerStyle}}>
                <div className='fsHeader'>
                    <IconButton onClick={props.onCancel}>
                        <CloseIcon />
                    </IconButton>
                    <Typography variant='h5' className='fsTitle'>{props.title}</Typography>
                    <IconButton onClick={props.onSubmit}>
                        <CheckIcon />
                    </IconButton>
                </div>
                <div className='fsContent'>
                    {props.children}
                </div>
            </div>
        </div>
    )

    return ReactDOM.createPortal(Modal, document.querySelector('#root'));
}