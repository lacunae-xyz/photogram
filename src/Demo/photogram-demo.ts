import { LitElement, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import Application from '../Application';
import IndexedDBProjectsDataSource from '../Application/IndexedDBProjectsDataSource';
import Csv from '../FilesParser/Csv';
import '../Project/photogram-project';

async function createDemoApplication() {
  const response = await fetch(new URL('/demo/data.csv', location.href));
  const csv = new File([await response.blob()], 'data.csv', {
    type: 'text/csv',
  });
  const data = await new Csv().execute([csv]);
  for (const shot of data) {
    shot.url = new URL(`/demo/${shot.id}.jpg`, location.href).href;
  }
  return Application.createNull({
    dataSource: IndexedDBProjectsDataSource.createNull({
      projects: [
        {
          key: 'demo',
          name: 'Le fardeau (démo)',
          data,
          colors: Application._calculateColors(data),
          template: 'small',
        },
      ],
    }),
  });
}

/**
 * The demo page: the project page on the demo data set, kept in memory.
 *
 * Event: `back`.
 */
@customElement('photogram-demo')
export class PhotogramDemo extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @state() private accessor application: Application | undefined;

  #created = false;

  connectedCallback() {
    super.connectedCallback();
    if (!this.#created) {
      this.#created = true;
      createDemoApplication()
        .then(application => (this.application = application))
        .catch(error => console.error(error));
    }
  }

  render() {
    return this.application
      ? html`<photogram-project
          project-id="demo"
          .application=${this.application}
          @back=${() => this.dispatchEvent(new Event('back'))}
        ></photogram-project>`
      : nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-demo': PhotogramDemo;
  }
}
