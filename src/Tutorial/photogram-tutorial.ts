import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { colors } from '../Application';
import '../Templates/photogram-tile-small';
import editable from '../illus/undraw_editable_dywm.svg';
import examination from '../illus/undraw_detailed_examination_joef.svg';

type Example = {
  sequence: string;
  action: string;
  label: string;
  period: string;
  fx: string;
};

const initialExample: Example = {
  sequence: '1',
  action: 'Théo est avec ses invités',
  label: 'salon',
  period: 'soir',
  fx: 'fx',
};

/**
 * The tutorial page, in French, with a tile that follows the example row typed in its form.
 *
 * Slot: `header`.
 */
@customElement('photogram-tutorial')
export class PhotogramTutorial extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .tutorial-container {
      background-image:
        url(${unsafeCSS(editable)}), url(${unsafeCSS(examination)});
      background-position:
        left 1rem bottom,
        right 1rem bottom;
      background-size: 16rem;
      background-repeat: no-repeat;
      background-attachment: fixed;
    }

    .tutorial-layout {
      background-color: var(--pg-color-surface);
      max-width: 50rem;
      margin: auto;
      padding-bottom: var(--pg-space-4);
    }

    article {
      font-family: var(--pg-font-text);
    }

    h1 {
      font-family: var(--pg-font-mono);
      font-size: var(--pg-font-size-5);
    }

    .tutorial-example-layout {
      display: grid;
      grid-template-columns: 50% 50%;
      grid-column-gap: var(--pg-space-4);
      margin-bottom: var(--pg-space-4);
    }

    .tutorial-example-form {
      display: grid;
      grid-template-columns: 50% 50%;
      grid-row-gap: var(--pg-space-4);
      align-content: center;
    }

    input {
      font: inherit;
    }

    .tutorial-example-tile {
      font-family: var(--pg-font-mono);
    }
  `;

  @state() private accessor example = initialExample;

  #onInput(event: InputEvent) {
    const { name, value } = event.target as HTMLInputElement;
    this.example = { ...this.example, [name]: value };
  }

  #field(label: string, name: keyof Example) {
    return html`<label>${label}</label
      ><input
        type="text"
        name=${name}
        value=${initialExample[name]}
        @input=${this.#onInput}
      />`;
  }

  render() {
    const { sequence, action, label, period, fx } = this.example;
    return html`<div class="tutorial-container">
      <div class="tutorial-layout">
        <slot name="header"></slot>
        <article>
          <h1>Comment utiliser Photogram</h1>
          <p>
            <strong>Photogram</strong> permet de créer un séquencier image des
            différentes scènes composant un film ou une série.
          </p>
          <section>
            <h1>1. Créer un tableau informatif</h1>
            <p>
              Première étape, remplir un tableau contenant toutes les
              informations nécessaires à la création du séquencier.
              <br />
              Certaines de ses informations sont indispensables au bon
              fonctionnement de Photogram, alors que d'autres sont facultatives.
              <br />
              L'ordre des colonnes du tableau doit être le suivant :<br />
            </p>
            <ol>
              <li>
                <strong>Numéro de séquence</strong> : Les informations de cette
                colonne doivent impérativement commencer par un numéro, sous
                peine d'être ignorées par le logiciel.
              </li>
              <li>Description de l'action</li>
              <li>
                Label : Un label est une couleur associée à vos photogrammes.
                Tous les photogrammes ayant le même label auront la même
                couleur. A vous de définir le nom de vos labels (numéro, décor,
                etc.)
              </li>
              <li>
                Périodes : 4 mots possibles : <em>Matin, soir, jour, nuit</em>.
                A choisir en fonction de la temporalité souhaitée. Ces mots
                restent en français, même si l'interface est en anglais.
              </li>
              <li>
                FX : Pour indiquer une séquence truquée, il suffit de mettre une
                valeur quelconque dans cette colonne.
              </li>
            </ol>
            <p>
              Seule la première colonne est indispensable au bon fonctionnement
              de Photogram. Toutes les données remplies ici pourront par la
              suite être modifiées directement sur le site.
            </p>
            <p>
              Une fois ce tableau complété, il doit être enregistré au format
              <strong>.csv</strong>, et être nommé <strong>data.csv</strong>.
            </p>
          </section>
          <section>
            <h1>2. Exporter des photogrammes</h1>
            <p>
              Votre tableau « data.csv » complété, et déplacé dans un dossier
              dédié à votre projet, vous pouvez maintenant exporter vos
              photogrammes, au fur et à mesure de l'avancée du tournage.
              <br />
              Il suffit de les exporter au format .jpeg, de les nommer
              <em>exactement</em> comme les numéros de séquence utilisés dans
              votre tableau, et de les mettre dans le même dossier que
              <strong>data.csv</strong>.
            </p>
          </section>
          <section>
            <h1>3. Et la magie fut...</h1>
            <div class="tutorial-example-layout">
              <form class="tutorial-example-form">
                ${this.#field('Numéro de séquence', 'sequence')}
                ${this.#field("Description de l'action", 'action')}
                ${this.#field('Label', 'label')}
                ${this.#field('Périodes', 'period')} ${this.#field('Fx', 'fx')}
              </form>
              <div class="tutorial-example-tile">
                <photogram-tile-small
                  .sequence=${sequence}
                  .action=${action}
                  .period=${period}
                  .fx=${fx}
                  .url=${'/demo/1.jpg'}
                  .color=${label === '' ? '' : colors[label.length % 16]}
                  color-distribution="indicator"
                ></photogram-tile-small>
              </div>
            </div>
            <p>
              Une fois la première étape terminée, vous pouvez d'ores et déjà
              ajouter votre projet à Photogram, avec l'un de ces deux boutons :
            </p>
            <ul>
              <li>
                <strong>Import project</strong> copie le dossier dans votre
                navigateur. Fonctionne dans tous les navigateurs.
              </li>
              <li>
                <strong>Open project</strong> lie le dossier à Photogram, dans
                Chrome et Edge. Vos modifications sont enregistrées dans un
                fichier <strong>data.json</strong>, dans ce même dossier.
              </li>
            </ul>
            <p>
              Les images déjà présentes dans le dossier sont prises en compte.
              Ajoutez les suivantes au fur et à mesure, depuis chaque
              photogramme, ou déposez-les dans le dossier : en le rouvrant, ou
              en le réimportant avec son <strong>data.json</strong> exporté, les
              nouvelles images rejoignent leurs photogrammes.
            </p>
            <p>
              Maintenant que vous êtes sur le site, vous pouvez à votre
              convenance changer la couleur de vos labels, en supprimer, en
              rajouter, et modifier toutes les informations de vos photogrammes.
            </p>
            <p>A vous de jouer !</p>
          </section>
          <section>
            <h1>À savoir :</h1>
            <ul>
              <li>
                Pour travailler sur un autre ordinateur, exportez un projet
                importé avec <strong>Export data.json</strong>. Placez ce
                fichier dans le dossier du projet, avec les images, puis
                importez le dossier : vos modifications sont conservées.
              </li>
              <li>
                Toutes les données de vos projets sont traitées en local, et ne
                sont jamais mises en ligne.
              </li>
            </ul>
          </section>
        </article>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-tutorial': PhotogramTutorial;
  }
}
