import React from 'react';
import './FormGroupEditor.css';
import FormGroup from '../FormGroup';

export default function FormGroupEditor(props) {
    return (
        <div className='fgEditRoot'>
            <div className='fgEditBody'>
                <FormGroup properties={props.properties} onPropertyChange={props.onPropertyChange} customNames={props.customNames} server={props.server} />
            </div>
        </div>
    );
}