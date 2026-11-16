import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '../Header';
import './index.css';

const contactEmail = 'contact@lacunae.xyz';

export default function PrivacyPolicy() {
  return (
    <div className="privacy-layout">
      <Helmet>
        <title>Photogram · Privacy policy</title>
        <meta
          name="description"
          content="Photogram keeps your projects on your device. What it counts, and who hosts it."
        />
      </Helmet>
      <Header />
      <article>
        <h1>Privacy policy</h1>
        <p>
          Photogram keeps your projects on your device. Nothing you import or
          open is uploaded.
        </p>
        <p>
          Imported projects live in your browser: their data in IndexedDB, their
          images in Cache Storage. An opened folder stays where it is. Photogram
          reads it and writes your changes to <code>data.json</code> in that
          folder. Deleting a project, or clearing this site&apos;s data in your
          browser, removes it from the browser.
        </p>
        <p>
          Fixor reads your EDLs and their images in the browser. They are not
          sent anywhere.
        </p>
        <p>
          We count visits with Umami Cloud. It sets no cookies and stores no
          personal data. It records the pages you open, with project ids removed
          from the addresses, and four actions: creating, deleting, leaving and
          printing a project, with the number of tiles printed. See{' '}
          <a href="https://umami.is/privacy">Umami&apos;s privacy policy</a>.
        </p>
        <p>
          Netlify hosts the site. Its servers log requests, including your IP
          address and browser. See{' '}
          <a href="https://www.netlify.com/privacy/">
            Netlify&apos;s privacy policy
          </a>
          .
        </p>
        <p>
          There are no accounts, no emails and no ads, and no Google sign-in.
          Umami and Netlify are the only third parties.
        </p>
        <p>
          Questions: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
        <p>Last updated 16 November 2026.</p>
      </article>
    </div>
  );
}
