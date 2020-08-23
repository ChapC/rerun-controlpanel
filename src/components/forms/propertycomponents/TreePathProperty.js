import React, { useState, useRef, useEffect } from 'react';
import { FormControl, TextField } from '@material-ui/core';
import TreeWalker from '../../TreeWalker';

export default function TreePathProperty(props) {
    const [showTreeWalker, setShowTreeWalker] = useState(false);
    const treeTextInput = useRef();
    const [tree, setTree] = useState(null);
    const [treeChange, setTreeChange] = useState(0);

    useEffect(() => {
        if (tree == null) {
            props.server.sendRequest(`property/treepath/${props.property.id}/node:get`, '').then((node) => setTree(node)); //Get the root node
        }
    });

    const toPathString = (array) => {
        let str = '';
        array.map((key) => str += '/' + key);
        return str;
    }

    const replaceNodeAtPath = (tree, pathArray, newNode) => {
        //Start from the root of the tree, move down each key
        let newTree = Object.assign(tree, {});
        let currentNode = newTree;
        //Traverse the tree to just before the last component of the path
        for (let key of pathArray.slice(0, pathArray.length - 1)) {
            for (let child of currentNode.children) {
                if (child.key === key) {
                    currentNode = child;
                    break;
                }
            }
        }

        for (let i = 0; i < currentNode.children.length; i++) {
            if (currentNode.children[i].key === newNode.key) {
                currentNode.children.splice(i, 1);
                currentNode.children.push(newNode);
                break;
            }
        }
        
        return newTree;
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

    const hideTreeWalker = () => setShowTreeWalker(false);
    const onTreeSelect = (keyArray) => {
        //TreeWalker onSelect returns an array of keys to the selected node
        let pathString = toPathString(keyArray);

        if (getNodeAtPath(tree, pathString).nodeType === 'branch') {
            //Send a request to fetch the children for this tree node
            props.server.sendRequest(`property/treepath/${props.property.id}/node:get`, pathString).then((node) => {
                //Update our local tree with this new node
                let newTree = replaceNodeAtPath(tree, keyArray, node);
                setTree(newTree);
                setTreeChange(treeChange+1); //eehhh there's probably a better way to trigger a render (setTree won't work as the key is the same)
            });
        } else {
            //This is an edge node - select it
        }

        props.onChange(pathString);
    };

    return (
        <div>
            <FormControl className='fullWidthField'>
                <TextField label={props.property.name} value={props.property.value}
                    onChange={(ev) => props.onChange(ev.target.value)} variant='filled' inputRef={treeTextInput} onClick={() => setShowTreeWalker(true)} />
            </FormControl>
            <TreeWalker open={showTreeWalker} onSelect={onTreeSelect} onClose={hideTreeWalker} tree={tree} anchorEl={treeTextInput.current} treeChange={treeChange} />
        </div>
    )
}