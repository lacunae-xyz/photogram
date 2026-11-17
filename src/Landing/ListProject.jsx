import React, { Component } from 'react';
import './ListProject.css';
import '../Projects/photogram-import-project';
import '../Projects/photogram-project-card';
class ListProject extends Component {
  render() {
    return (
      <div className="list-project">
        <div className="list-project-header">
          <h2>Projects</h2>
          <photogram-import-project
            onimport={event => this.props.onImportProject(event.detail.files)}
          />
        </div>
        <div className="list-project-container">
          <ul id="grid">
            {this.props.value.map(project => {
              return (
                <photogram-project-card
                  key={project.key}
                  project={project}
                  onopen={event => this.props.onLinkProject(event.detail.key)}
                  ondelete={event =>
                    this.props.onDeleteProject(event.detail.key)
                  }
                />
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

export default ListProject;
