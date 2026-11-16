// CRA's Jest setup polyfilled fetch with whatwg-fetch, which accepts relative URLs like a browser. Node's Request doesn't.
const NodeRequest = globalThis.Request;
globalThis.Request = class Request extends NodeRequest {
  constructor(input, init) {
    super(
      typeof input === 'string' ? new URL(input, window.location.href) : input,
      init,
    );
  }
};
