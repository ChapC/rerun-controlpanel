import React, { useState, useEffect } from 'react';
import FormEditorContext from '../components/forms/FormEditorContext';
import { debounce } from "debounce";

const submitModifiedSettings = debounce((newSettings, server) => {
    server.sendRequest('setUserSetting', newSettings).then((response) => {
        console.info(response);
    }).catch(error => console.error(error));
}, 800);

export default function SettingsPage(props) {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        if (settings == null) {
            props.server.sendRequest('getUserSettings').then(s => setSettings(s)).catch(error => console.error(error));
        }
    });

    const onPropertyChange = (propertyKey, newValue) => {
        let settingsCopy = Object.assign({}, settings);
        settingsCopy[propertyKey].value = newValue;
        submitModifiedSettings(settingsCopy, props.server);
        setSettings(settingsCopy);
    }

    return (
        <div>
            <FormEditorContext properties={settings} onPropertyChange={onPropertyChange} />
        </div>
    );
}