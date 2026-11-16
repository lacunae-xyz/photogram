import React, { useEffect, useMemo, useState } from 'react';
import track from '../track';
import './index.css';
import { useHistory } from 'react-router-dom';
import useDocumentMeta from '../useDocumentMeta';
import Header from '../Header';
import Application from '../Application';
import './photogram-import-project';
import './photogram-open-project';
import './photogram-project-card';
import './photogram-quota';

function ListProject() {
  useDocumentMeta({
    title: 'Photogram · Projects',
    description:
      'Import or open a project folder, and find the projects stored in this browser.',
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
    <div className="projects-container">
      <Header nav="projects" />
      <div className="action-project">
        <photogram-import-project
          onimport={event => onImportProject(event.detail.files)}
        />
        <photogram-open-project
          onopen={event => onOpenProject(event.detail.dirHandle)}
        />
      </div>
      {projects.length <= 0 ? (
        <img
          className="projects-empty"
          src="/illus/undraw_empty_street_sfxm.svg"
          alt="No project"
        />
      ) : null}
      <ul id="grid">
        {projects.map(project => {
          return (
            <photogram-project-card
              key={project.key}
              project={project}
              onopen={event => onLinkProject(event.detail.key)}
              ondelete={event => onDeleteProject(event.detail.key)}
            />
          );
        })}
      </ul>
      <photogram-quota value={quotas.value} max={quotas.max} />
    </div>
  );
}

export default ListProject;
