const id = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+/g;

/** Replaces project ids (uuids, numbers) in the path of an absolute or root-relative URL. */
export function cleanUrl(url) {
  if (typeof url !== 'string') {
    return url;
  }
  const [, origin = '', path = '', rest = ''] = url.match(
    /^([a-z][a-z\d+.-]*:\/\/[^/]*)?([^?#]*)(.*)$/i,
  );
  return origin + path.replace(id, '{id}') + rest;
}

/** Umami calls this before every send (`data-before-send` in index.html). */
export function beforeSend(type, payload) {
  return {
    ...payload,
    url: cleanUrl(payload.url),
    referrer: cleanUrl(payload.referrer),
  };
}

/** No-op when Umami is blocked or not loaded. */
export default function track(event, data) {
  window.umami?.track(event, data);
}
