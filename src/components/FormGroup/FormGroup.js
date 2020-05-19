import React from 'react';
import './FormGroup.css';
import { Typography, Divider} from '@material-ui/core';
import IntegerProperty from './propertycomponents/IntegerProperty';
import NumberProperty from './propertycomponents/NumberProperty';
import StringProperty from './propertycomponents/StringProperty';
import StringSelectProperty from './propertycomponents/StringSelectProperty';
import TreePathProperty from './propertycomponents/TreePathProperty';

//Renders controls for SavablePropertyGroups
export default function FormGroup(props) {
    const formItems = [];

    /*Custom property names can be specified with props.customNames.
    It looks like 
    [
        { key: "secondPropertyKey", name: "Renamed second property" }
    ]
    

    //TODO: This custom data thing should be extended and React-ified. It could probably be specified as children, like
            <FormGroup>
                //Custom properties go here
                <Property key='secondPropertyKey' name: 'Renamed second property' />
                //Maybe even custom components to override the controls here
                <CustomPropertyControl key='customPropertyKey' /> //ValidatedProperty passed as a prop
            </FormGroup>
    */

    if (props.properties) {
        const formObjects = [];

        //Pre-customization pass - searching for supported ValidatedProperties and nested groups
        for (let key in props.properties) {
            let property = props.properties[key];

            //Check that it's a ValidatedProperty
            if (property && property.type) {
                if (property.type === 'subgroup') {
                    //The keys on ValidatedProperty's [value] object are ValidatedProperties themselves (a nested group)
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

        //Convert all the ValidatedProperty objects into components
        for (let o of formObjects) {
            if (o.type === 'group') {
                formItems.push(
                    <PropertyGroup key={'nested' + o.key}>
                        {o.items.map((i) => getPropertyComponent(i.key, i, props.onPropertyChange, props.server))}
                    </PropertyGroup>
                );
            } else {
                formItems.push(getPropertyComponent(o.key, o, props.onPropertyChange, props.server));
            }
        }
    }

    return (
        <div style={{ ...props.style }}>
            {formItems}
        </div>
    );
}

function getPropertyComponent(key, property, onPropertyChange, server) {
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
        case 'treepath':
            return (<TreePathProperty key={key} property={property} onChange={(v) => onPropertyChange(key, v)} server={server} />);
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
            let blankProperty = propertyOutline;
            blankProperty.type = propertyOutline.propertyType;
            blankProperty.value = '';
            blankProperty.name = propertyOutline.name;

            blankForm[key] = blankProperty;
        }
    }
    return blankForm;
}

//Converts an object with ValidatedProperties to an object with their values
//eg. {favCol: {name: "Favourite colour", type:"string", value:"green"}} --> {favCol: "green"}
export function validatedPropertiesToValues(propGroup) {
    let justValues = {};
    for (let key in propGroup) {
        let prop = propGroup[key];
        if (prop.value && prop.type) { //This is a FormProperty
            if (prop.type === 'subgroup') { //This FormProperty a nested form
                justValues[key] = validatedPropertiesToValues(prop.value);
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