import React from 'react';
import { Router, Route, useHistory } from 'react-router-dom';
import Fixor from './Fixor';
import Header from './Header';
import history from './history';
import useDocumentMeta from './useDocumentMeta';
import './Demo/photogram-demo';
import './Landing/photogram-landing';
import './PrivacyPolicy/photogram-privacy';
import './Project/photogram-project';
import './Projects/photogram-projects';
import './Tutorial/photogram-tutorial';
import './App.css';

// Until photogram-app (06 §6.2 step 6): each route renders its page element, with the header and the router's navigation.

function Landing() {
  useDocumentMeta({
    title: 'Photogram · A tool for editor assistants',
    description:
      'Create a board of photograms ready to print and cut, from a CSV file and your stills. Your projects stay on your device.',
  });
  const history = useHistory();
  return (
    <photogram-landing onnavigate={event => history.push(event.detail.path)}>
      <Header slot="header" />
    </photogram-landing>
  );
}

function Tutorial() {
  useDocumentMeta({
    title: 'Photogram · Comment utiliser Photogram',
    description:
      'Préparer le tableau et les photogrammes de votre projet, puis les ajouter à Photogram',
  });
  return (
    <photogram-tutorial>
      <Header slot="header" nav="tutorial" />
    </photogram-tutorial>
  );
}

function Projects() {
  useDocumentMeta({
    title: 'Photogram · Projects',
    description:
      'Import or open a project folder, and find the projects stored in this browser.',
  });
  const history = useHistory();
  return (
    <photogram-projects onnavigate={event => history.push(event.detail.path)}>
      <Header slot="header" nav="projects" />
    </photogram-projects>
  );
}

function Project({ match }) {
  const history = useHistory();
  return (
    <photogram-project
      project-id={match.params.id}
      onback={() => history.goBack()}
    />
  );
}

function Demo() {
  useDocumentMeta({
    title: 'Photogram - Try the tool for assistant editors',
    description: 'Learn and play with our demo data set',
  });
  const history = useHistory();
  return <photogram-demo onback={() => history.goBack()} />;
}

function PrivacyPolicy() {
  useDocumentMeta({
    title: 'Photogram · Privacy policy',
    description:
      'Photogram keeps your projects on your device. What it counts, and who hosts it.',
  });
  return (
    <photogram-privacy>
      <Header slot="header" />
    </photogram-privacy>
  );
}

export default function App() {
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
