import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';

export default function StringSelectProperty(props) {
    return (
        <FormControl variant="filled" className='fullWidthField'>
            <InputLabel>{props.property.name}</InputLabel>
            <Select value={props.property.value} onChange={(ev) => props.onChange(ev.target.value)}>
                {props.property.options.map(option => <MenuItem value={option} key={option}>{option}</MenuItem>)}
            </Select>
        </FormControl>
    )
}
