import React, { Component } from 'react';
import { Router, Route } from 'react-router-dom';
import Landing from './Landing';
import Projects from './Projects';
import Project from './Project';
import Demo from './Demo';
import PrivacyPolicy from './PrivacyPolicy';
import Tutorial from './Tutorial';
import Fixor from './Fixor';
import history from './history';
import './App.css';

class App extends Component {
  render() {
    return (
      <React.StrictMode>
        <Router history={history}>
          <div className="App">
            <Route exact path="/" component={Landing} />
            <Route exact path="/tutorial" component={Tutorial} />
            <Route exact path="/projects" component={Projects} />
            <Route exact path="/project/:id" component={Project} />
            <Route exact path="/project-demo" component={Demo} />
            <Route exact path="/privacy-policy" component={PrivacyPolicy} />
            <Route exact path="/fixor" component={Fixor} />
          </div>
        </Router>
      </React.StrictMode>
    );
  }
}

export default App;
