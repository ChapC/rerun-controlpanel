import React from 'react';

//Pass-through component used by FormGroup
export default function FormProperty(props) {
    return React.cloneElement(props.formPropertyComponent, props);
}
