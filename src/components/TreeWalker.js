import React, { useState, useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import DoneIcon from '@material-ui/icons/Done';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { Typography, ListItem, ListItemText } from '@material-ui/core';
import List from '@material-ui/core/List';
import DescriptionIcon from '@material-ui/icons/Description';
import FolderIcon from '@material-ui/icons/Folder';
import AnchoredPopup from './../helpers/AnchoredPopup';

export default function TreeWalker(props) {
    const [inputWidth, setInputWidth] = useState(150);
    const [slideDirection, setSlideDirection] = useState('right');
  
    useEffect(() => {
      if (props.open) { //Resize container to match anchorEl width
        setInputWidth(props.anchorEl.offsetWidth);
      }
    }, [props.open]);
  
    const handleClickOut = (event) => {
      //Minimize popper if something other than the anchor element was clicked
      if (props.open && event.target !== props.anchorEl) {
        props.onClose();
      }
    }
  
    //Keep the anchorEl input focused when clicking the popover
    const handlePopperClick = (event) => {
      event.preventDefault();
    }
  
    //Start at the root of tree
    const [currentPath, setCurrentPath] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null); //Is a node currently selected? This will be null if the current path ends in a directory
  
    const handleNodeSelect = (sNode) => {
      setSlideDirection('right');
  
      if (sNode.nodeType === 'branch') { //This node is a directory; open it
        setCurrentPath([...currentPath, sNode.key]);
        setSelectedNode(null);
      } else { //This node is an end node; select it
        setSelectedNode(sNode);
      }
      props.onSelect([...currentPath, sNode.key]);
    }
  
    const handleBackClick = () => {
      //Go back up the node tree
      let newPath = currentPath.slice(0, currentPath.length - 1);
      setSlideDirection('left');
      setCurrentPath(newPath);
      setSelectedNode(null);
      props.onSelect(newPath.map((node) => node.key));
    }

    const getNodeAtPath = (tree, path) => {
      //Start from the root of the tree, move down each key
      let currentNode = tree;
      for (let key of path) {    
        if (!currentNode.children) {
          break; //This node has no children, cannot progress further
        }
        let foundChild = false;
        for (let child of currentNode.children) {
          if (child.key === key) {
            currentNode = child;
            foundChild = true;
            break;
          }
        }
    
        if (!foundChild) {
          break; //Couldn't find a child with the given key
        }
      }
      return currentNode;
    }
  
    let backIconStyle = currentPath.length > 0 ? { opacity: 1, cursor: 'pointer' } : { opacity: 0, cursor: 'default' };
    let currentDirectory = currentPath.length > 0 ? getNodeAtPath(props.tree, currentPath) : (props.tree ? props.tree : {});
      
    return (
      <div style={{ ...props.style }}>
        <ClickAwayListener onClickAway={handleClickOut}>
          <AnchoredPopup open={props.open} anchorEl={props.anchorEl}>
            <Paper style={{ width: inputWidth, height: '350px', overflow: 'hidden' }} onMouseDown={handlePopperClick}>
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '100%', height: '40px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px', boxSizing: 'border-box' }}>
                  <ArrowBackIcon style={backIconStyle} onClick={currentPath.length > 0 ? handleBackClick : null} />
                  <Typography>{currentDirectory.key}</Typography>
                  <DoneIcon style={{ cursor: 'pointer' }} onClick={props.onClose} />
                </div>
                <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', flex: 1, position: 'relative', overflow: 'hidden' }}>
                  <ComponentSlider duration={300} direction={slideDirection}>
                    <TreeDirectory nodes={currentDirectory.children} selected={selectedNode} onNodeSelect={handleNodeSelect} key={currentDirectory.key} />
                  </ComponentSlider>
                </div>
              </div>
            </Paper>
          </AnchoredPopup>
        </ClickAwayListener>
      </div>
    )
  }
  
  function TreeDirectory(props) {
    let nodes = props.nodes;

    if (props.nodes == null) {
      nodes = [];
    }
    return (
      <List style={{ padding: 0 }}>
        {nodes.map((node) => {
          //Return either a folder node (has children) or a file node (no children)
          if (node.nodeType === 'branch') {
            //This is a folder
            return (
              <ListItem key={node.key} button divider onClick={() => props.onNodeSelect(node)}>
                <FolderIcon style={{ marginRight: '5px' }} />
                <ListItemText>{node.key}</ListItemText>
                <ArrowForwardIosIcon />
              </ListItem>
            )
          } else {
            //This is a file
            return (
              <ListItem key={node.key} selected={props.selected ? node.key === props.selected.key : false} button divider onClick={() => props.onNodeSelect(node)}>
                <DescriptionIcon style={{ marginRight: '5px' }} />
                <ListItemText>{node.key}</ListItemText>
              </ListItem>
            )
          }
        })}
      </List>
    )
  }
  
  const sliderBase = { position: 'absolute', height: '100%', width: '100%' };
  
  //The class-based syntax is used here so that setState can be used with a callback (not supported with useState hook)
  class ComponentSlider extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        showingA: true, //Is the "A" slider currently on screen?
        sliderAStyles: {}, sliderAContent: props.children,
        sliderBStyles: {}, sliderBContent: null
      }
    }
  
    inTimeout = null;
    unmountTimeout = null;
  
    componentDidUpdate(prevProps) {
      if (prevProps.children.key === this.props.children.key) {
        return;
      }
  
      //*gasp* A child! Transition to it
      let outContent, outStyles, inContent, inStyles; //Setters for this transition
      if (this.state.showingA) {
        outContent = (value) => this.setState({ sliderAContent: value });
        outStyles = (value) => this.setState({ sliderAStyles: value });
        inContent = (value) => this.setState({ sliderBContent: value });
        inStyles = (value, callback) => this.setState({ sliderBStyles: value }, callback);
      } else {
        outContent = (value) => this.setState({ sliderBContent: value });
        outStyles = (value) => this.setState({ sliderBStyles: value });
        inContent = (value) => this.setState({ sliderAContent: value });
        inStyles = (value, callback) => this.setState({ sliderAStyles: value }, callback);
      }
  
      //Clear any pending animations
      clearTimeout(this.inTimeout);
      clearTimeout(this.unmountTimeout);
  
      let inStartPosition = '0';
      let outEndPosition = '0';
  
      //Different transition depending on direction
      if (!this.props.direction || this.props.direction === 'right') {
        //Bring the new child in from the right, old child out to the left
        inStartPosition = '100%';
        outEndPosition = '-100%';
  
      } else if (this.props.direction === 'left') {
        //Bring the new child in from the left, old child out to the right
        inStartPosition = '-100%';
        outEndPosition = '100%';
      } else {
        console.warn('[ComponentSlider] Invalid direction "' + this.props.direction + '"');
      }
  
      //Move in slider to the starting position
      inStyles({ transition: 'none', transform: `translateX(${inStartPosition})` }, () => {
        this.inTimeout = setTimeout(() => {
          inContent(this.props.children);
          //Transition the in slider in and the out slider out
          inStyles({ transition: `transform ${this.props.duration}ms ease`, transform: 'translateX(0)' });
          outStyles({ transition: `transform ${this.props.duration}ms ease`, transform: `translateX(${outEndPosition})` });
          //Un-mount the old child once the transition is finished
          this.unmountTimeout = setTimeout(() => outContent(null), this.props.duration);
        }, 10);
      });
  
      this.setState({ showingA: !this.state.showingA });
    }
  
    render() {
      return (
        <div style={{ position: 'relative' }}>
          <div style={{ ...this.state.sliderAStyles, ...sliderBase }}>
            {this.state.sliderAContent}
          </div>
          <div style={{ ...this.state.sliderBStyles, ...sliderBase }}>
            {this.state.sliderBContent}
          </div>
        </div>
      )
    }
  }