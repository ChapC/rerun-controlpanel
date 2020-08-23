import { formOutlineToProperties } from "./FormEditorContext";
const cloneDeep = require('lodash.clonedeep');

/*
    Contains a mutable target object for a FormEditorContext.

    Typical usage:
    1) Fetch a form object from the server side and create an EditorTargetProvider with it. Point updateTarget to an object (modifiedForm) in the parent's React state.
    2) Display a FormEditorContext, have it display current values from modifiedForm and hook its onPropertyChange callback up to this class.
    3) The user edits something -> FormEditorContext sends us an alert -> we update modifiedForm -> rerender and repeat!
    4) Once editing is done, the parent submits modifiedForm to the server.
*/
export default class EditorTargetProvider {

    constructor(targetBase, updateTarget, server) {
        this.editorTarget = cloneDeep(targetBase);
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
            //The target property is a normal JS object, just set it directly - TODO: Once all other forms have migrated to the new system on the server-side, this check won't be needed
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