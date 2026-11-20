import { parse } from 'smol-toml';
import source from '../netlify.toml?raw';

// `serve -s` in the e2e suite doesn't read netlify.toml, so the config itself is the contract here. routes.spec checks
// the deployed site when BASE_URL points at it.

type Redirect = { from: string; to: string; status?: number; force?: boolean };
type Headers = { for: string; values: Record<string, string> };

const config = parse(source) as { redirects: Redirect[]; headers: Headers[] };

describe('netlify.toml', () => {
  it.each(['/fixor', '/fixor/*'])(
    'redirects %s to Fixor’s site, permanently, before the app fallback',
    from => {
      const index = config.redirects.findIndex(rule => rule.from === from);
      expect(config.redirects[index]).toEqual({
        from,
        to: 'https://fixor.photogram.app/',
        status: 301,
      });
      const fallback = config.redirects.findIndex(rule => rule.from === '/*');
      expect(index).toBeLessThan(fallback);
    },
  );

  it('falls back to the app for any other path', () => {
    expect(config.redirects.at(-1)).toEqual({
      from: '/*',
      to: '/',
      status: 200,
    });
  });

  it('denies framing on every path', () => {
    const all = config.headers.find(rule => rule.for === '/*');
    expect(all?.values['X-Frame-Options']).toBe('DENY');
    expect(all?.values['Content-Security-Policy']).toBe(
      "frame-ancestors 'none'",
    );
  });
});
