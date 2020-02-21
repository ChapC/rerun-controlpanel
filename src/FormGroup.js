import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';

export default function FormGroup(props) {
    const formItems = [];

    const onPropertyChange = (property, newValue) => {
        props.onPropertyChange(property.propKey, newValue);
    }

    if (props.properties) {
        for (let key in props.properties) {
            let property = props.properties[key];

            //Check that it's a form property
            if (property.type) {
                property['propKey'] = key;

                switch (property.type) {
                    case 'string':
                        formItems.push(<StringProperty key={key} property={property} 
                            onChange={(v) => onPropertyChange(property, v)} />);
                        break;
                    case 'number':
                        break;
                    case 'ip':
                        formItems.push(<StringProperty key={key} property={property} 
                            onChange={(v) => onPropertyChange(property, v)} validate={validateIP} />);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    return (
        <div style={{ ...props.style }}>
            {formItems}
        </div>
    );
}

const ipRegex = new RegExp(/^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/);
function validateIP(ipString) {

    //Check that the string doesn't end with :
    if (ipString[ipString.length - 1] === ":") {
        return false;
    }

    let ipAndPort = ipString.split(":");
    //Check that the first half is a valid IP address
    if (!ipRegex.test(ipAndPort[0]) && ipAndPort[0] !== 'localhost') {
        return false;
    }
    //If there is a port, check that it's within the valid range
    if (ipAndPort[1]) {
        return ipAndPort[1] <= 65535;
    } else {
        return true;
    }
}

function StringProperty(props) {
    let error = false;
    let helpText = null;
    if (props.validate && props.property.value) {
        error = !props.validate(props.property.value);
        if (error) {
            helpText = 'Not a valid IP address';
        }
    }
    return (
        <FormControl className='fullWidthField'>
            <TextField label={props.property.name} value={props.property.value} 
                onChange={(ev) => props.onChange(ev.target.value)} variant='filled' error={error} helperText={helpText} />
        </FormControl>
    );
}

function NumberProperty(props) {

}