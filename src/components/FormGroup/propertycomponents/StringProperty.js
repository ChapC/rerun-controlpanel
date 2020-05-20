import React from 'react';
import { FormControl, TextField } from '@material-ui/core';

export default function StringProperty(props) {
    let error = false;
    let helpText = null;
    if (props.validate && props.property.value) {
        error = !props.validate(props.property.value);
        helpText = props.helpText;
    }
    return (
        <FormControl className='fullWidthField'>
            <TextField label={props.label ? props.label : props.property.name} value={props.property.value}
                onChange={(ev) => props.onChange(ev.target.value)} variant='filled'
                error={error} helperText={error ? helpText : null} />
        </FormControl>
    );
}