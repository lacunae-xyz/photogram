import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type Application from '../Application';
import type { Project } from '../Application/types';
import track from '../track';

type Host = ReactiveControllerHost & HTMLElement;

/**
 * A page's project list and storage quota, and the use cases that change them.
 * Opening a project sends `navigate` from the host, with `detail.path`.
 */
export class ProjectsController implements ReactiveController {
  projects: Project[] = [];

  quota = { value: 0, max: 0 };

  readonly #host: Host;

  readonly #application: () => Application;

  constructor(host: Host, application: () => Application) {
    this.#host = host;
    this.#application = application;
    host.addController(this);
  }

  hostConnected() {
    this.#checkQuota();
    this.#application()
      .list()
      .then(projects => this.#show(projects));
  }

  import(files: File[]) {
    track('project-create');
    this.#change(this.#application().add(files));
  }

  open(dirHandle: FileSystemDirectoryHandle) {
    track('project-create');
    this.#change(this.#application().open(dirHandle));
  }

  delete(key: string) {
    track('project-delete');
    this.#change(this.#application().delete(key));
  }

  async link(key: string) {
    try {
      const application = this.#application();
      if (await application.needsPermission(key)) {
        await application.requestPermission(key);
      }
      this.#host.dispatchEvent(
        new CustomEvent('navigate', { detail: { path: `/project/${key}` } }),
      );
    } catch (error) {
      console.error(error);
    }
  }

  #change(projects: Promise<Project[]>) {
    projects
      .then(projects => this.#show(projects))
      .then(() => this.#checkQuota())
      .catch(error => console.log(error));
  }

  #show(projects: Project[]) {
    this.projects = projects;
    this.#host.requestUpdate();
  }

  #checkQuota() {
    navigator.storage.estimate().then(estimate => {
      this.quota = { value: estimate.usage ?? 0, max: estimate.quota ?? 0 };
      this.#host.requestUpdate();
    });
  }
}
