import { readAsArrayBuffer, type ReadResult } from './FileReader';

export interface ImageUrl {
  name: string;
  url: string;
}

interface ImageCache {
  put(request: Request, response: Response): Promise<void>;
}

interface ImageCaches {
  open(cacheName: string): Promise<ImageCache>;
  delete(cacheName: string): Promise<boolean>;
  has(cacheName: string): boolean | Promise<boolean>;
}

class Images {
  _caches: ImageCaches;

  constructor(caches: ImageCaches) {
    this._caches = caches;
  }

  static create() {
    return new Images(caches);
  }

  static createNull(
    { factory }: { factory: (cacheName: string) => ImageCache } = {
      factory: () => {
        return new StubbedCache();
      },
    },
  ) {
    return new Images(new StubbedCaches(factory));
  }

  async execute(
    identifier: string,
    files: ArrayLike<File> | Iterable<File>,
  ): Promise<ImageUrl[]> {
    const imageType = /^image\//;
    const images = Array.from(files).filter(file => imageType.test(file.type));
    return Promise.all(
      images.map(async file => {
        const fileResult = await readAsArrayBuffer(file);
        return this._writeFile(identifier, fileResult);
      }),
    );
  }

  async clear(identifier: string) {
    const result = await this._caches.delete(this._name(identifier));
    if (result) {
      return null;
    } else {
      throw Error(`Cannot delete the cache: ${identifier}`);
    }
  }

  async has(identifier: string) {
    return Promise.resolve(this._caches.has(this._name(identifier)));
  }

  _name(identifier: string) {
    return 'image-cache-' + identifier;
  }

  async _writeFile(
    identifier: string,
    event: ReadResult<ArrayBuffer>,
  ): Promise<ImageUrl> {
    const cache = await this._caches.open(this._name(identifier));
    const headers = new Headers();
    headers.append('Content-Type', event.file.type);
    headers.append('Content-Length', String(event.file.size));

    await cache.put(
      new Request(`/project/${identifier}/images/${event.file.name}/`),
      new Response(event.result, {
        status: 200,
        statusText: 'From Cache',
        headers: headers,
      }),
    );

    return {
      name: event.file.name,
      url: `/project/${identifier}/images/${event.file.name}/`,
    };
  }
}

export default Images;

class StubbedCache implements ImageCache {
  cache: Record<string, Response> = {};

  put(request: Request, response: Response) {
    this.cache[request.url] = response;
    return Promise.resolve();
  }
}

class StubbedCaches implements ImageCaches {
  factory: (cacheName: string) => ImageCache;
  caches: Record<string, ImageCache> = {};

  constructor(factory: (cacheName: string) => ImageCache) {
    this.factory = factory;
  }

  // Always a new cache: the JS version checked `this.has[cacheName]`, which is always undefined.
  open(cacheName: string) {
    this.caches[cacheName] = this.factory(cacheName);
    return Promise.resolve(this.caches[cacheName]);
  }
  delete(cacheName: string) {
    if (this.has(cacheName)) {
      delete this.caches[cacheName];
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
  has(cacheName: string) {
    return this.caches[cacheName] !== undefined;
  }
}
