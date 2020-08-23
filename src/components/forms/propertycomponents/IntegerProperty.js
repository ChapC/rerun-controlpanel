import React from 'react';
import { FormControl, TextField } from '@material-ui/core';

export default function IntegerProperty(props) {
    let error = false;
    let helpText = null;
    if (props.validate && props.property.value) {
        error = !props.validate(props.property.value);
        helpText = props.helpText;
    }
    return (
        <FormControl className='fullWidthField' style={props.style}>
            <TextField label={props.label ? props.label : props.property.name} value={props.property.value + ''}
                type='number'
                onChange={(ev) => props.onChange(parseInt(ev.target.value) | 0)} variant='filled'
                error={error} helperText={helpText} />
        </FormControl>
    );
}