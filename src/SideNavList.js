import React from 'react';
import './SideNavList.css';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HomeIcon from '@material-ui/icons/Home';
import DynamicFeedIcon from '@material-ui/icons/DynamicFeed';
import SettingsInputCompositeIcon from '@material-ui/icons/SettingsInputComposite';
import { BoltIcon } from './res/BoltIcon';

export function SideNavList(props) {
    const listItemStyle = [];
    const selectedStyleObject = {iconStyle: {color: '#552da6'}, textClassName: 'navListSelectedText', isButton: false};

    for (let i = 0; i < 4; i++) {
        listItemStyle.push({iconStyle: {}, textClassName: '', isButton: true});
    }

    switch (props.location.pathname) {
        case '/events': //Dashboard
            listItemStyle[1] = selectedStyleObject;
            break;
        case '/sources': //Dashboard
            listItemStyle[2] = selectedStyleObject;
            break;
        case '/settings': //Dashboard
            listItemStyle[3] = selectedStyleObject;
            break;
        default: //Dashboard
        listItemStyle[0] = selectedStyleObject;
        break; 
    }

    return (
        <div id='sideNavRoot'>
            <div id='navLogoSection'>
                <div id='navLogoContainer'>
                    <div id='navLogo'></div>
                </div>
                <Typography id='navRerunTitle' variant='h4'>Rerun</Typography>
                <Typography id='navVersion' variant='h5'>v0.1</Typography>
                <Typography id='navSignature' variant='subtitle1'><span role='img' aria-label='Coded by'>👨🏽‍💻</span> Chap Callanan <span role='img' aria-label=''>💚</span></Typography>
            </div>
            <Divider style={{margin: '0 30px'}}/>
            <div id='navListContainer'>
                <List>
                    <ListItem button onClick={() => props.navTo('/')}>
                        <ListItemIcon>
                            <HomeIcon style={listItemStyle[0].iconStyle} />
                        </ListItemIcon>
                        <ListItemText className={listItemStyle[0].textClassName} primary='Dashboard'/>
                    </ListItem>
                    <ListItem button onClick={() => props.navTo('/events')}>
                        <ListItemIcon>
                            <BoltIcon style={listItemStyle[1].iconStyle} />
                        </ListItemIcon>
                        <ListItemText className={listItemStyle[1].textClassName} primary='Events'/>
                    </ListItem>
                    <ListItem button onClick={() => props.navTo('/sources')}>
                        <ListItemIcon>
                            <DynamicFeedIcon style={listItemStyle[2].iconStyle} />
                        </ListItemIcon>
                        <ListItemText className={listItemStyle[2].textClassName} primary='Content sources'/>
                    </ListItem>
                    <ListItem button onClick={() => props.navTo('/settings')}>
                        <ListItemIcon>
                            <SettingsInputCompositeIcon style={listItemStyle[3].iconStyle} />
                        </ListItemIcon>
                        <ListItemText className={listItemStyle[3].textClassName} primary='Settings'/>
                    </ListItem>
                </List>
            </div>
        </div>
    );
}