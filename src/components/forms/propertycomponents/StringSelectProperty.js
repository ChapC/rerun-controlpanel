import React, { useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';

export default function StringSelectProperty(props) {

    useEffect(() => {
        if (props.defaultValue && props.property.value == '' && props.property.options.includes(props.defaultValue)) {
            props.onChange(props.defaultValue);
        }
    }, [props.defaultValue]);

    return (
        <FormControl variant="filled" className='fullWidthField' style={props.style}>
            <InputLabel>{props.label ? props.label : props.property.name}</InputLabel>
            <Select value={props.property.value} onChange={(ev) => props.onChange(ev.target.value)}>
                {props.property.options.map(option => <MenuItem value={option} key={option}>{option}</MenuItem>)}
            </Select>
        </FormControl>
    )
}
