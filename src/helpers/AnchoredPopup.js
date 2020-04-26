import React from 'react';
import ReactDOM from 'react-dom';

//Replacement for material-ui's Popper component. Popper uses CSS transform3d property, which was causing a weird blurry effect in Chrome.
export class AnchoredPopup extends React.Component {
    render() {
        let top = 0, left = 0;

        if (this.props.anchorEl != null && this.props.anchorEl.getBoundingClientRect) {
            let rect = this.props.anchorEl.getBoundingClientRect();
            top = rect.top + rect.height; //Bottom of the element
            left = rect.left;
        }
    
        const Content = (
            <div style={{ position: 'absolute', top: top, left: left, zIndex: 100 }} ref={this.props.forwardedRef}>
                {this.props.children}
            </div>
        );
    
        if (this.props.open) {
            return ReactDOM.createPortal(Content, document.querySelector('#root'));
        } else {
            return null;
        }
    }
}

export default React.forwardRef((props, ref) => <AnchoredPopup {...props} forwardedRef={ref} />);