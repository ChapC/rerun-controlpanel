import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ControlPanel from './ControlPanel';
import { BrowserRouter } from "react-router-dom";
ReactDOM.render(<BrowserRouter><ControlPanel /></BrowserRouter>, document.getElementById('root'));