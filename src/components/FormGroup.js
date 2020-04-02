import React from 'react';
import './FormGroup.css';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

export default function FormGroup(props) {
    const formItems = [];

    /*Custom property names can be specified with props.customNames.
    It looks like 
    [
        { key: "secondPropertyKey", name: "renamedSecondProperty" }
    ]
    */

    if (props.properties) {
        const formObjects = [];

        //Pre-customization pass - searching for supported properties and nested forms
        for (let key in props.properties) {
            let property = props.properties[key];

            //Check that it's a form property
            if (property && property.type) {
                if (property.type === 'subform') {
                    //The keys on FormProperty's [value] object are FormProperties themselves (a nested form)
                    const group = {
                        type: 'group', key: key,
                        items: []
                    };

                    for (let childKey in property.value) {
                        if (property.value[childKey].type) {
                            group.items.push({ key: `${key}.value.${childKey}`, ...property.value[childKey] });
                        }
                    }

                    formObjects.push(group);
                } else {
                    formObjects.push({ key: key, ...property });
                }
            }
        }

        //Customization pass
        if (props.customNames) {
            for (let customItem of props.customNames) {
                //Custom names
                if (customItem.name) {
                    //Look for the target property in formObjects
                    for (let targetObj of formObjects) {
                        if (targetObj.type === 'group') {
                            //Search within the group
                            for (let childProperty of targetObj.items) {
                                if (childProperty.key === customItem.key) {
                                    childProperty.name = customItem.name;
                                    break;
                                }
                            }
                        } else {
                            if (targetObj.key === customItem.key) {
                                targetObj.name = customItem.name;
                                break;
                            }
                        }
                    }
                }
                //Custom order
                for (let customItem of props.customNames) {
                    if (customItem.placeAfter) {
                        //Find the indexes of placeAfter target and target object
                        let targetObjIndex, placeAfterIndex;

                        for (let i = 0; i < formObjects.length; i++) {
                            if (formObjects[i].key === customItem.key) {
                                targetObjIndex = i;
                            }
                            if (formObjects[i].key === customItem.placeAfter) {
                                placeAfterIndex = i;
                            }
                        }

                        if (targetObjIndex && placeAfterIndex && targetObjIndex != placeAfterIndex + 1) {
                            let targetObj = formObjects[targetObjIndex];
                            formObjects.splice(targetObjIndex, 1);
                            formObjects.splice(placeAfterIndex + 1, 0, targetObj);
                        }
                    }
                }
            }
        }

        //Convert all the FormProperty objects into components
        for (let o of formObjects) {
            if (o.type === 'group') {
                formItems.push(
                    <PropertyGroup key={'nested' + o.key}>
                        {o.items.map((i) => getPropertyComponent(i.key, i, props.onPropertyChange))}
                    </PropertyGroup>
                );
            } else {
                formItems.push(getPropertyComponent(o.key, o, props.onPropertyChange));
            }
        }
    }

    return (
        <div style={{ ...props.style }}>
            {formItems}
        </div>
    );
}

function getPropertyComponent(key, property, onPropertyChange) {
    switch (property.type) {
        case 'string':
            return (<StringProperty key={key} property={property} onChange={(v) => onPropertyChange(key, v)} />);
        case 'number':
            return (<NumberProperty key={key} property={property} onChange={(v) => onPropertyChange(key, v)} />);
        case 'int':
            return (<IntegerProperty key={key} property={property} onChange={(v) => onPropertyChange(key, v)} />);
        case 'ip':
            return (<StringProperty key={key} property={property} onChange={(v) => onPropertyChange(key, v)}
                validate={validateIP} helpText='Not a valid IP address' />);
        case 'select-string':
            return (<StringSelectProperty key={key} property={property} onChange={(v) => onPropertyChange(key, v)} />);
        default:
            return null;
    }
}

//Converts a FormOutline to a form with blank properties (compatible with FormGroup)
export function formOutlineToProperties(outline) {
    let blankForm = {};
    for (let key in outline) {
        if (outline[key].propertyType) {
            let propertyOutline = outline[key];
            let blankProperty = { type: propertyOutline.propertyType, value: '', name: propertyOutline.name };
            if (propertyOutline.options) {
                blankProperty.options = propertyOutline.options;
            }
            blankForm[key] = blankProperty;
        }
    }
    return blankForm;
}

//Converts an object with FormProperties to an object with their values
//eg. {favCol: {name: "Favourite colour", type:"string", value:"green"}} --> {favCol: "green"}
export function formPropertiesToValues(propGroup) {
    let justValues = {};
    for (let key in propGroup) {
        let prop = propGroup[key];
        if (prop.value && prop.type) { //This is a FormProperty
            if (prop.type === 'subform') { //This FormProperty a nested form
                justValues[key] = formPropertiesToValues(prop.value);
            } else { //This FormProperty is just a normie
                justValues[key] = prop.value;
            }
        }
    }
    return justValues;
}

function PropertyGroup(props) {
    return (
        <div>
            <Typography variant='subtitle1'>{props.name}</Typography>
            <div className='propGroupSection'>
                <div className='propGroupLine'>
                    <Divider orientation='vertical' />
                </div>
                <div style={{ width: '100%' }}>
                    {props.children}
                </div>
            </div>
        </div>
    )
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
        helpText = props.helpText;
    }
    return (
        <FormControl className='fullWidthField'>
            <TextField label={props.property.name} value={props.property.value}
                onChange={(ev) => props.onChange(ev.target.value)} variant='filled'
                error={error} helperText={error ? helpText : null} />
        </FormControl>
    );
}

function IntegerProperty(props) {
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
                onChange={(ev) => props.onChange(parseInt(ev.target.value))} variant='filled'
                error={error} helperText={helpText} />
        </FormControl>
    );
}

function NumberProperty(props) {
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
                onChange={(ev) => props.onChange(parseFloat(ev.target.value))} variant='filled'
                error={error} helperText={helpText} />
        </FormControl>
    );
}

function StringSelectProperty(props) {
    return (
        <FormControl variant="filled" className='fullWidthField'>
            <InputLabel>{props.property.name}</InputLabel>
            <Select value={props.property.value} onChange={(ev) => props.onChange(ev.target.value)}>
                {props.property.options.map(option => <MenuItem value={option} key={option}>{option}</MenuItem>)}
            </Select>
        </FormControl>
    )
}