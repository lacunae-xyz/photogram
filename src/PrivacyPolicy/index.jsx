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
          Every project lives in your browser: its data in IndexedDB, its images
          in Cache Storage. An opened folder also stays where it is, and
          Photogram writes your changes to <code>data.json</code> in that
          folder. Deleting a project, or clearing this site&apos;s data in your
          browser, removes it from the browser.
        </p>
        <p>
          Fixor reads your EDLs and their images in the browser. They are not
          sent anywhere.
        </p>
        <p>
          We count visits with Umami, which we run ourselves. It sets no cookies
          and stores no personal data. It records the pages you open, with
          project ids removed from the addresses, and four actions: creating,
          deleting, leaving and printing a project, with the number of tiles
          printed. With each, it records the referring site, your browser,
          operating system, device type, screen size, language and country.
          Aiven stores these records in a database for us. See{' '}
          <a href="https://aiven.io/privacy">Aiven&apos;s privacy policy</a>.
        </p>
        <p>
          Netlify hosts the site and our Umami server. Its servers log requests,
          including your IP address and browser. See{' '}
          <a href="https://www.netlify.com/privacy/">
            Netlify&apos;s privacy policy
          </a>
          .
        </p>
        <p>
          Photogram has no accounts, sends no emails, shows no ads and has no
          Google sign-in. Netlify and Aiven are the only third parties.
        </p>
        <p>
          Questions: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
        <p>Last updated 16 November 2026.</p>
      </article>
    </div>
  );
}
