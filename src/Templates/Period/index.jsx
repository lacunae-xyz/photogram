import React, { Component } from 'react';
import { periodToClassName, periodToSrc } from './period';
import '../dot.css';
import './index.css';
class Periode extends Component {
  render() {
    return (
      <img
        alt="period"
        className={`dot period ${periodToClassName(this.props.value)}`}
        src={periodToSrc(this.props.value)}
      />
    );
  }
}

export default Periode;
