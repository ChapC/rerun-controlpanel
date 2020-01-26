import React, { useState } from 'react';
import './SideNavList.css';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { BrowserRouter, Route, Link } from "react-router-dom";

export function SideNavList() {
    return (
        <div id='sideNavRoot'>
            <div id='navLogoSection'>
                <div id='navLogoContainer'>
                    <div id='navLogo'></div>
                </div>
                <Typography id='navRerunTitle' variant='h4'>Rerun</Typography>
                <Typography id='navVersion' variant='h5'>v0.1</Typography>
                <Typography id='navSignature' variant='subtitle1'>👨🏽‍💻 Chap Callanan 💚</Typography>
            </div>
            <Divider style={{margin: '0 30px'}}/>
        </div>
    );
}