import React, { Component } from 'react';
import backgroundColor from './background';
import './Container.css'
class Container extends Component {

    render() {
        return (
            <div className={`ele ${this.props.className}`} style={{ backgroundColor: backgroundColor(this.props.colorDistribution, this.props.color) }} onClick={this.props.onClick}>
                {this.props.children}
            </div>
        )
    }
}

export default Container;
