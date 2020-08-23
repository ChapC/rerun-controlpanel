import React from 'react';
import './FormEditorContext.css';
import { Typography, Divider} from '@material-ui/core';
import IntegerProperty from './propertycomponents/IntegerProperty';
import NumberProperty from './propertycomponents/NumberProperty';
import StringProperty from './propertycomponents/StringProperty';
import StringSelectProperty from './propertycomponents/StringSelectProperty';
import TreePathProperty from './propertycomponents/TreePathProperty';
import FormProperty from './FormProperty';

/*
    Parent component for the forms system.
    FormEditorContext wraps a collection of UI components that make up a form to send data to the server-side.
    The form can be made up of any number of child components and FormEditorContext will search through them and connect up to any
    <FormProperty /> components within. Any time these <FormProperty /> components are updated by the user, FormEditorContext
    pushes out those changes via props.onPropertyChange in a format designed to be passed to an EditorTargetProvider.

    The FormEditorContext accepts form objects from the server in this format:

    {
        userName: { name: "User name", type: "string", value: "Jimmy J. Jayjimothyjams" },
        age: { name: "Age", type: "integer", value: 385 }
    }

    and lets you display it like this:

    <FormEditorContext>
        <div>
            <img />
            <span>
                <FormProperty key='userName' />
            </span>
        </div>
        <div>
            <SomeOtherComponent>
                <FormProperty key='age' />
            </SomeOtherComponent>
        </div>
    </FormEditorContext>

    TODO: This last part probably isn't needed anymore. Should be removed.
    FormEditorContext also displays default <FormProperty /> components for properties that are returned by the server
    but aren't manually declared in the FormEditorContext's children.
*/
export default function FormEditorContext(props) {
    const propertyComponents = [];

    if (props.properties) {
        const componentContainerArray = []; //Ordered list of ComponentContainers
        const formComponentMap = {}; //A structure whose keys will mirror props.properties, but with ComponentContainers (that are inside the above array) for values

        //First, we look for properties within props.properties that have FormProperty components already defined for them
        const componentProvider = (key, property) => getPropertyComponent(key, property, props.onPropertyChange, props.server);
        processFormPropertyComponents(props, props.properties, componentContainerArray, formComponentMap, '', componentProvider);

        //Then, we pick up anything from props.properties that wasn't handled by a FormProperty in the last step. These are appended to the end of the form
        fillMissingProperties(props.properties, formComponentMap, componentContainerArray, '', componentProvider);

        //Finally, convert all the ComponentContainers into components
        containersToComponents(componentContainerArray, propertyComponents);
    }

    return (
        <div style={{ ...props.style }}>
            {propertyComponents}
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

class ComponentContainer {
    //Also can contains childrenList: [] which is an ordered list of children and childrenMap: {} which is a map of child containers
    constructor(component, propertyKey) {
        this.component = component;
        this.propertyKey = propertyKey; //The key of the form property this component is linked to (if any)
    }
}

//Recursively scans parentComponent's children for <FormProperty /> and hooks them up to their target property object
function processFormPropertyComponents(parentComponent, properties, componentArray, componentMap, keyPrefix, componentProvider) {
    let children = [];
    //props.children can either be an array, if there are multiple children, or a singular child if there's only one
    if (Array.isArray(parentComponent.children)) {
        children = parentComponent.children;
    } else if (parentComponent.children != null) {
        children.push(parentComponent.children);
    }

    children.map((child, childIndex) => {
        let childComponent = child;
        if (typeof(child) === 'function') {
            //This is a function as-a-child. Call it to get the resulting React components
            childComponent = child(validatedPropertiesToValues(properties)); //Function children get access to the current property values
        }

        if (childComponent == null) return;

        if (childComponent.type === FormProperty && childComponent.key) {
            //Find the property that this FormProperty wants to display
            let propertyObject = properties[childComponent.key];
            //Check that the targeted property exists and is a ValidatedProperty (from the server in a format we understand)
            if (propertyObject && propertyObject.name && propertyObject.type && propertyObject.value != null) {
                if (propertyObject.type === 'subgroup') {
                    let groupChildrenArray = [];
                    let groupChildrenMap = {};

                    if (childComponent.props && childComponent.props.children) {
                        //Check if there are any defined FormProperty components in here
                        processFormPropertyComponents(childComponent.props, propertyObject.value, groupChildrenArray, groupChildrenMap, keyWithPrefix(childComponent.key, keyPrefix), componentProvider);
                    }

                    //Create a ComponentContainer for this group
                    let component = <PropertyGroup key={'group' + childComponent.key}></PropertyGroup>;
                    let container = new ComponentContainer(React.cloneElement(childComponent, { ...childComponent.props, formPropertyComponent: component }), childComponent.key);

                    container.childrenList = groupChildrenArray;
                    container.childrenMap = groupChildrenMap;

                    componentMap[childComponent.key] = container;                                        
                    componentArray.push(container);
                } else {
                    //Grab a component for this property, wrap it in a container and add it to the map and array
                    let component = componentProvider(keyWithPrefix(childComponent.key, keyPrefix), propertyObject);
                    let container = new ComponentContainer(React.cloneElement(childComponent, { ...childComponent.props, formPropertyComponent: component }), childComponent.key);
                    componentMap[childComponent.key] = container;
                    componentArray.push(container);
                }
            }
        } else {
            //No need to add this component to the componentMap as it isn't connected to a property
            if (childComponent.props && childComponent.props.children) {
                //This is a non-FormProperty with children. There may be FormProperty components inside here! WE NEED TO GO DEEPER!
                let children = [];
                processFormPropertyComponents(childComponent.props, properties, children, componentMap, keyPrefix, componentProvider);
                let container = new ComponentContainer(React.cloneElement(childComponent, { ...childComponent.props, key: childComponent.key | childIndex }));
                componentArray.push(container);
                container.childrenList = children;
                //Convert the children into a property key -> ComponentContainer map
                let childMap = {};
                children.map((childContainer, index) => {
                    childMap[childContainer.propertyKey ? childContainer.propertyKey : index] = childContainer;
                });
                container.childrenMap = childMap;
            } else {
                //This is a non-FormProperty with no children. Keep this element as-is (as long as it has a key - otherwise add one in)
                let component = childComponent;
                if (!childComponent.key && (typeof(childComponent) === 'object' || typeof(childComponent) === 'function')) { //Don't add keys to primitives
                    component = React.cloneElement(childComponent, {...childComponent.props, key: childIndex})
                }
                let container = new ComponentContainer(component);
                componentArray.push(container);
            }
        }
    });
}

function fillMissingProperties(properties, existingComponentMap, componentOutArray, keyPrefix, componentProvider) {
    for (let propertyKey of Object.keys(properties)) {
        let property = properties[propertyKey];
        if (property.name && property.type && property.value != null) { //Is this a ValidatedProperty
            if (property.type === 'subgroup') {
                let groupContainer = existingComponentMap[propertyKey];
                //Create a container for this group if one doesn't already exist
                if (!groupContainer) {
                    groupContainer = new ComponentContainer(<PropertyGroup key={'group' + propertyKey} />, propertyKey);
                    componentOutArray.push(groupContainer);
                    existingComponentMap[propertyKey] = groupContainer;
                    groupContainer.childrenMap = {};
                    groupContainer.childrenList = [];
                }

                //Fill this group's children as well
                let filledChildren = [];
                fillMissingProperties(property.value, groupContainer.childrenMap, filledChildren, keyWithPrefix(propertyKey, keyPrefix), componentProvider);
                groupContainer.childrenList = groupContainer.childrenList.concat(filledChildren);
            } else {
                //Has a component already been created for this property?
                if (!existingComponentMap[propertyKey]) { //No, so we'll create a default one
                    componentOutArray.push(new ComponentContainer(componentProvider(keyWithPrefix(propertyKey, keyPrefix), property), propertyKey));
                }
            }
        }
    }
}

//Recursively converts the ContainerComponents to components and pushes them to componentArray
function containersToComponents(containerArray, componentArray) {
    for (let container of containerArray) {
        if (container.childrenList) {
            //This container has a bunch of other ComponentContainers as children - they need to be converted too and added to this container's component
            let componentChildren = [];
            containersToComponents(container.childrenList, componentChildren);
            componentArray.push(React.cloneElement(container.component, container.component.props, componentChildren));
        } else {
            componentArray.push(container.component);
        }
    }
}

function keyWithPrefix(key, prefix) {
    if (prefix.length > 0) {
        return prefix + '.' + key;
    } else {
        return key;
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

//Converts a server-side properties object to a plain key-value object
//eg. {favCol: {name: "Favourite colour", type:"string", value:"green"}} --> {favCol: "green"}
export function validatedPropertiesToValues(propGroup) {
    let justValues = {};
    for (let key in propGroup) {
        let prop = propGroup[key];
        if (prop.name && prop.type && prop.value != null) { //This is a ValidatedProperty
            if (prop.type === 'subgroup') { //This ValidatedProperty a nested group
                justValues[key] = validatedPropertiesToValues(prop.value);
            } else { //This ValidatedProperty is just a normie
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
