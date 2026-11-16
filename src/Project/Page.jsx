import React, { Component } from 'react';
import track from '../track';
import Image from '../FilesParser/Images';
import '@lacunae-xyz/photogram-design-system/pg-big-button.js';
import './photogram-configuration';
import './photogram-tile-form';
import './photogram-tiles';
import './photogram-toolbar';
import '../styles.css';
import './Page.css';

class Page extends Component {
  constructor(props) {
    super(props);
    this.application = props.application;
    this.state = {
      project: {},
      template: 'small',
      permission: false,
    };
  }

  componentDidMount() {
    // Chromium updates hover at the start of the frame after a layout. Without a frame between the page shell's
    // first layout and the tiles, the pointer enters the shell in the frame that lays out every tile: React's
    // pointerover listeners run there, and the whole layout frame counts as a long task. A hidden tab has no frames.
    this.shellHovered = document.hidden
      ? Promise.resolve()
      : new Promise(resolve =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => setTimeout(resolve)),
          ),
        );
    this.loadData();
  }

  async loadData() {
    if (await this.application.needsPermission(this.props.id)) {
      this.setState(Object.assign(this.state, { permission: true }));
    } else {
      this.application
        .get(this.props.id)
        .then(async project => {
          await this.shellHovered;
          if (project.template === undefined) {
            project.template = 'small';
          }
          if (project.colorDistribution === undefined) {
            project.colorDistribution = 'indicator';
          }
          this.setState(
            Object.assign(this.state, { project: project, permission: false }),
          );
        })
        .catch(e => {
          console.error(e);
        });
    }
  }

  // Controlled checkboxes revert on click until the save reloads the project: show the new value now.
  showSetting(setting) {
    this.setState({ project: { ...this.state.project, ...setting } });
  }

  back() {
    track('project-back');
    this.props.onBack();
  }

  print() {
    track('project-print', { tiles: this.state.project.data.length });
    window.print();
  }

  async exportDataJson() {
    const json = await this.application.exportDataJson(this.props.id);
    const url = URL.createObjectURL(
      new Blob([json], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }

  render() {
    const project = this.state.project;
    const unlinked = project.key !== undefined && !project.dirLink;
    const reload = () => this.loadData();
    return (
      <div>
        <photogram-tile-form
          shot={this.state.data}
          colors={project.colors}
          onclose={() => this.setState({ data: undefined })}
          onsave={event => {
            this.setState({ data: undefined });
            this.application
              .update(this.props.id, event.detail.shot)
              .then(reload);
          }}
          onnew-image={event => {
            const shotId = this.state.data.id;
            Image.create()
              .execute(this.props.id, event.detail.files)
              .then(([image]) =>
                // The form may have closed, or moved to another shot, while the image was stored.
                this.setState(({ data }) =>
                  image && data?.id === shotId
                    ? { data: { ...data, url: image.url } }
                    : null,
                ),
              )
              .catch(e => console.error(e));
          }}
          ondelete-image={() =>
            this.setState({ data: { ...this.state.data, url: null } })
          }
          onset-main={event =>
            this.application
              .updateMainPicture(this.props.id, event.detail.url)
              .then(() => this.setState({ data: undefined }))
              .catch(e => console.error(e))
          }
        />
        <div className="layout-parent">
          <div className="layout-top">
            <photogram-toolbar
              heading={project.name}
              exportable={unlinked}
              onback={() => this.back()}
              onprint={() => this.print()}
              onexport={() =>
                this.exportDataJson().catch(e => console.error(e))
              }
            />
          </div>
          <div className="layout-left">
            {this.state.permission ? (
              <PromptPermission
                promptPermission={async () => {
                  try {
                    await this.application.requestPermission(this.props.id);
                    this.loadData();
                  } catch (error) {
                    console.error(error);
                  }
                }}
              />
            ) : (
              <photogram-tiles
                shots={project.data}
                template={project.template}
                colors={project.colors}
                defaultColor={project.defaultColor}
                colorDistribution={project.colorDistribution}
                fontFamily={project.fontFamily}
                printSpaceAround={project.printSpaceAround}
                ontile-select={event =>
                  this.setState({ data: event.detail.shot })
                }
              />
            )}
          </div>
          <div className="layout-right">
            <photogram-configuration
              template={project.template}
              fontFamily={project.fontFamily}
              printSpaceAround={project.printSpaceAround}
              colorDistribution={project.colorDistribution}
              defaultColor={project.defaultColor}
              colors={project.colors}
              ontemplate-change={event =>
                this.application
                  .updateTemplate(this.props.id, event.detail.template)
                  .then(reload)
              }
              onfont-family-change={event =>
                this.application
                  .updateFontFamily(this.props.id, event.detail.fontFamily)
                  .then(reload)
              }
              onprint-space-around-change={event => {
                const { printSpaceAround } = event.detail;
                this.showSetting({ printSpaceAround });
                this.application
                  .updatePrintSpaceAround(this.props.id, printSpaceAround)
                  .then(reload);
              }}
              oncolor-distribution-change={event => {
                const { colorDistribution } = event.detail;
                this.showSetting({ colorDistribution });
                this.application
                  .updateColorDistribution(this.props.id, colorDistribution)
                  .then(reload);
              }}
              ondefault-color-change={event =>
                this.application
                  .updateDefaultColor(this.props.id, event.detail.color)
                  .then(reload)
              }
              oncolor-change={event =>
                this.application
                  .updateColor(this.props.id, {
                    [event.detail.label]: event.detail.color,
                  })
                  .then(reload)
              }
              oncolor-delete={event =>
                this.application
                  .deleteColor(this.props.id, event.detail.label)
                  .then(reload)
              }
            />
          </div>
        </div>
      </div>
    );
  }
}

function PromptPermission(props) {
  return (
    <div className="prompt-permission">
      <img
        className="prompt-permission-img"
        src="/illus/undraw_secure_files_re_6vdh.svg"
        alt=""
      />
      <p className="prompt-permission-description">
        Permission needs to be given again to access to the files.
      </p>
      <p className="prompt-permission-reason">
        Permission will be asked after each reload
      </p>
      <pg-big-button onClick={() => props.promptPermission()}>
        Grant permission
      </pg-big-button>
    </div>
  );
}

export default Page;
