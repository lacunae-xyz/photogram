import React, { Component } from 'react';
import getContrastYIQ from './contrast';
import './Sequence.css'
class Sequence extends Component {

    render() {
        const color = this.props.color
        return (
            <span className={`sequence ${color ? 'sequence-colored-' + getContrastYIQ(color) : ''}`} style={{ 'background': color }}>{this.props.value}</span>
        )
    }
}

export default Sequence;
