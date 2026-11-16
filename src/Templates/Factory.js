import React, { Component } from 'react';
import Small from './Small';
import Large from './Large';

class TemplateFactory extends Component {
  renderImage() {
    if (this.props.type) {
      switch (this.props.type) {
        case 'small':
          return React.createElement(Small, {
            file: this.props.file,
            onTile: this.props.onTile,
          });
        case 'large':
          return React.createElement(Large, {
            file: this.props.file,
            onTile: this.props.onTile,
          });
        default:
          return null;
      }
    }
  }
  render() {
    return this.renderImage();
  }
}

export default TemplateFactory;
