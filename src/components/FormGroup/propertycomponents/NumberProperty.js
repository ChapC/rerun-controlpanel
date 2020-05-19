import React from 'react';
import { FormControl, TextField } from '@material-ui/core';

export default function NumberProperty(props) {
    let error = false;
    let helpText = null;
    if (props.validate && props.property.value) {
        error = !props.validate(props.property.value);
        helpText = props.helpText;
    }
    return (
        <FormControl className='fullWidthField'>
            <TextField label={props.property.name} value={props.property.value}
                type='number'
                onChange={(ev) => props.onChange(parseFloat(ev.target.value) | 0)} variant='filled'
                error={error} helperText={helpText} />
        </FormControl>
    );
}