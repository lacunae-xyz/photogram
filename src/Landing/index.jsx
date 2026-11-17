import React, { useEffect, useMemo, useState } from 'react';
import track from '../track';
import useDocumentMeta from '../useDocumentMeta';
import Header from '../Header';
import Creators from './Creators';
import EmptyProject from './EmptyProject';
import ListProject from './ListProject';
import '../Projects/photogram-quota';
import Application from '../Application';
import '../styles.css';
import './index.css';
import { useHistory } from 'react-router-dom';

export default function Landing() {
  useDocumentMeta({
    title: 'Photogram · A tool for editor assistants',
    description:
      'Create a board of photograms ready to print and cut, from a CSV file and your stills. Your projects stay on your device.',
  });
  const application = useMemo(() => Application.create(), []);
  const history = useHistory();

  const [projects, setProjects] = useState([]);
  const [quotas, setQuotas] = useState({ max: 0, value: 0 });

  useEffect(() => {
    _checkQuotas();
    application.list().then(projects => setProjects(projects));
  }, [application]);

  function _checkQuotas() {
    navigator.storage.estimate().then(estimate =>
      setQuotas({
        max: estimate.quota,
        value: estimate.usage,
      }),
    );
  }

  function onImportProject(files) {
    track('project-create');
    application
      .add(files)
      .then(projects => setProjects(projects))
      .then(_ => _checkQuotas())
      .catch(error => console.log(error));
  }

  function onOpenProject(dirHandle) {
    track('project-create');
    application
      .open(dirHandle)
      .then(projects => setProjects(projects))
      .then(_ => _checkQuotas())
      .catch(error => console.log(error));
  }

  function onDeleteProject(key) {
    track('project-delete');
    application
      .delete(key)
      .then(projects => setProjects(projects))
      .then(_ => _checkQuotas())
      .catch(error => console.log(error));
  }

  async function onLinkProject(key) {
    try {
      const needsPermission = await application.needsPermission(key);
      if (needsPermission) {
        await application.requestPermission(key);
      }
      history.push(`/project/${key}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="landing-container">
      <Header />
      {projects.length <= 0 ? null : (
        <div>
          <ListProject
            value={projects}
            onDeleteProject={key => onDeleteProject(key)}
            onImportProject={files => onImportProject(files)}
            onLinkProject={key => onLinkProject(key)}
          />
        </div>
      )}
      <EmptyProject
        onImportProject={files => onImportProject(files)}
        onOpenProject={dirHandle => onOpenProject(dirHandle)}
      />
      <photogram-quota value={quotas.value} max={quotas.max} />
      <Creators />
      <footer className="landing-footer">
        <a href="/privacy-policy">Privacy policy</a>
      </footer>
    </div>
  );
}
