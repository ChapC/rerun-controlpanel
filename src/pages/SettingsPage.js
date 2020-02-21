import React, { useState, useEffect } from 'react';
import FormGroup from '../components/FormGroup';
import { debounce } from "debounce";

const submitProperty = debounce((propertyKey, newValue, server) => {
    server.request('setUserSetting', { propertyKey: propertyKey, value: newValue }).then((response) => {
        console.info(response);
    }).catch(error => console.error(error));
}, 800);

export default function SettingsPage(props) {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        if (settings == null) {
            props.server.request('getUserSettings').then(s => setSettings(s)).catch(error => console.error(error));
        }
    });

    const onPropertyChange = (propertyKey, newValue) => {
        submitProperty(propertyKey, newValue, props.server);
        let settingsCopy = Object.assign({}, settings);
        settingsCopy[propertyKey].value = newValue;
        setSettings(settingsCopy);
    }

    return (
        <div>
            <FormGroup properties={settings} onPropertyChange={onPropertyChange} />
        </div>
    );
}