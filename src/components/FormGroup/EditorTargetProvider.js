//Contains a mutable target object for a FormGroupEditor. Property changes are automatically applied to the editor via onPropertyChange, and

import { formOutlineToProperties } from "./FormGroup";

//custom side-effects can be added via the updateTarget callback.
export default class EditorTargetProvider {

    constructor(targetBase, updateTarget, server) {
        this.editorTarget = Object.assign({}, targetBase);
        this.updateTarget = updateTarget; //This will usually point to a react setState call
        this.server = server;
    }

    onPropertyChange = (changedProperty, newValue) => {
        //changeProperty is a string with the format 'object.child.targetProperty', newValue is the value to set changeProperty to
        let objectNames = changedProperty.split('.');
        let targetPropertyName = objectNames.splice(-1, 1)[0];

        let targetObject = this.editorTarget;
        for (let objectName of objectNames) { //Traverse the editor target using each objectName as a key
            targetObject = targetObject[objectName];
            if (targetObject.type && targetObject.type === 'subgroup' && targetObject.value) {
                targetObject = targetObject.value; //If this is a subgroup, skip over the container into the children
            }
        }

        //Set the new value
        if (targetObject[targetPropertyName].value != null && targetObject[targetPropertyName].type && targetObject[targetPropertyName].name) {
            //The target property is a ValidatedProperty object, we want to set the 'value' property
            targetObject[targetPropertyName].value = newValue;
        } else {
            //The target property is a normal JS object, just set it directly - TODO: Once all other forms have migrated to FormGroup, this check won't be needed
            targetObject[targetPropertyName] = newValue;
        }

        if (targetObject[targetPropertyName].typeAliasFor) {
            //This property is a type alias for another SubGroupProperty. That means the outline for that SubGroupProperty changes depending on the value of this one!
            let pairedSubGroup = this.editorTarget[targetObject[targetPropertyName].typeAliasFor];
            this.server.sendRequest(`property/subgroup/${pairedSubGroup.id}/outline:get`, targetObject[targetPropertyName].value).then((outline) => {
                pairedSubGroup.value = formOutlineToProperties(outline);
                this.updateTarget(this.editorTarget);
            });
        }

        this.updateTarget(this.editorTarget);
    }
}