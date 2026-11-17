import { createTitleSizer, observeTitle, unobserveTitle } from './titleSizing';

// FontSizeAdjuster as it was before titleSizing replaced it: the reference for the sizes.
class FontSizeAdjuster {
  constructor(
    private min: number,
    private max: number,
  ) {}

  apply(node: FakeTitle) {
    node.style.fontSize = this.max + 'rem';
    if (this.hasOverflow(node.parentNode)) {
      node.style.fontSize = this.min + 'rem';
      if (!this.hasOverflow(node.parentNode)) {
        this.recApplyFontSize(node, this.min, this.max);
      }
    }
  }

  private recApplyFontSize(node: FakeTitle, minSize: number, maxSize: number) {
    const halfSize = minSize + (maxSize - minSize) / 2;
    node.style.fontSize = halfSize + 'rem';
    if (this.hasOverflow(node.parentNode)) {
      this.recApplyFontSize(node, minSize, halfSize);
    } else {
      if (maxSize - minSize > 0.05) {
        this.recApplyFontSize(node, halfSize, maxSize);
      }
    }
  }

  private hasOverflow(node: FakeTitle['parentNode']) {
    return node.scrollHeight > node.clientHeight;
  }
}

type Log = string[];

/** A title whose container overflows when `overflows(fontSize)` says so, and logs every write and read. */
function fakeTitle(
  name: string,
  overflows: (fontSize: string) => boolean,
  log: Log = [],
) {
  let fontSize = '';
  const writes: string[] = [];
  const title = {
    style: {
      get fontSize() {
        return fontSize;
      },
      set fontSize(size: string) {
        fontSize = size;
        writes.push(size);
        log.push(`write ${name}`);
      },
    },
    parentElement: {
      get scrollHeight() {
        log.push(`read ${name}`);
        return overflows(fontSize) ? 1 : 0;
      },
      clientHeight: 0,
    },
    get parentNode() {
      return title.parentElement;
    },
    writes,
  };
  return title;
}
type FakeTitle = ReturnType<typeof fakeTitle>;

function fakeFrames(msPerBatch = 0) {
  const callbacks: (() => void)[] = [];
  let time = 0;
  return {
    request: (callback: () => void) => callbacks.push(callback),
    requestAfterNext: (callback: () => void) =>
      callbacks.push(() => callbacks.push(callback)),
    now: () => (time += msPerBatch),
    pending: () => callbacks.length,
    run() {
      const callback = callbacks.shift();
      callback?.();
      return callback !== undefined;
    },
    runAll() {
      let frames = 0;
      while (this.run()) {
        frames++;
      }
      return frames;
    },
  };
}

// FontSizeAdjuster ran under `html { font-size: 62.5% }`; titleSizing runs under the browser's 16px root.
const legacyRootPx = 10;
const rootPx = 16;

/** An inline rem font-size in px, rounded so the two searches' floating-point noise compares equal. */
function px(fontSize: string, root: number) {
  return Math.round(parseFloat(fontSize) * root * 1e9) / 1e9;
}

/** A title whose container overflows above `limitPx`, sized by titleSizing. */
function fitting(name: string, limitPx: number, log?: Log) {
  return fakeTitle(name, size => px(size, rootPx) > limitPx, log);
}

/** The px FontSizeAdjuster wrote, last one being its answer. */
function legacy(overflowsPx: (sizePx: number) => boolean) {
  const title = fakeTitle('legacy', size =>
    overflowsPx(px(size, legacyRootPx)),
  );
  new FontSizeAdjuster(0.2, 2).apply(title);
  return title.writes.map(size => px(size, legacyRootPx));
}

function writtenPx(title: FakeTitle) {
  return title.writes.map(size => px(size, rootPx));
}

function batched(titles: FakeTitle[], frames = fakeFrames()) {
  const sizer = createTitleSizer<FakeTitle>(frames);
  titles.forEach(title => sizer.size(title));
  frames.runAll();
}

/** Deterministic pseudo-random numbers in [0, 1). */
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe('search', () => {
  test('writes the same sizes as FontSizeAdjuster for every fitting size', () => {
    const limits = [0, 1, 2, 2.001, 20, 20.001, 30];
    for (let limit = 0; limit <= 21; limit += 0.037) {
      limits.push(limit);
    }
    for (const limit of limits) {
      const title = fitting('new', limit);
      batched([title]);
      expect(writtenPx(title), `limit ${limit}px`).toEqual(
        legacy(sizePx => sizePx > limit),
      );
    }
  });

  test('writes the same sizes as FontSizeAdjuster for any sequence of measures', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const legacyAnswer = random(seed);
      const expected = legacy(() => legacyAnswer() < 0.5);
      const answer = random(seed);
      const title = fakeTitle('new', () => answer() < 0.5);
      batched([title]);
      expect(writtenPx(title), `seed ${seed}`).toEqual(expected);
    }
  });

  test('titles searched together end on the sizes they would alone', () => {
    const limits = [1, 3.3, 5, 12.7, 19.9, 25];
    const titles = limits.map((limit, i) => fitting(`${i}`, limit));
    batched(titles);
    titles.forEach((title, i) => {
      const alone = legacy(sizePx => sizePx > limits[i]);
      expect(px(title.style.fontSize, rootPx)).toEqual(alone.at(-1));
    });
  });
});

describe('scheduling', () => {
  test('leaves the next frame to the browser, then sizes', () => {
    const frames = fakeFrames();
    const sizer = createTitleSizer<FakeTitle>(frames);
    const title = fakeTitle('a', () => false);
    sizer.size(title);
    frames.run();
    expect(title.style.fontSize).toEqual('');
    frames.run();
    expect(title.style.fontSize).toEqual('1.25rem');
  });

  test('writes every title of a batch before reading any, one layout per search step', () => {
    const log: Log = [];
    const titles = [0.3, 0.9, 1.5].map((limit, i) =>
      fakeTitle(`${i}`, size => parseFloat(size) > limit, log),
    );
    batched(titles);
    const steps = log.join(',').split(/(?<=read \d),(?=write)/);
    for (const step of steps) {
      expect(step).toMatch(/^(write \d,)+(read \d,?)+$/);
    }
    expect(steps.length).toEqual(Math.max(...titles.map(t => t.writes.length)));
    expect(log.filter(entry => entry.startsWith('read')).length).toEqual(
      titles.reduce((reads, title) => reads + title.writes.length, 0),
    );
  });

  test('a batch costs as many layouts as its longest search', () => {
    const log: Log = [];
    const titles = Array.from({ length: 100 }, (_, i) =>
      fakeTitle(`${i}`, size => parseFloat(size) > i / 50, log),
    );
    batched(titles);
    const layouts = log.join(',').split(/(?<=read \d+),(?=write)/).length;
    expect(layouts).toEqual(Math.max(...titles.map(t => t.writes.length)));
  });

  test('leaves the rest of the queue to the next frame once the frame budget is spent', () => {
    const frames = fakeFrames(6);
    const sizer = createTitleSizer<FakeTitle>(frames, {
      batchSize: 10,
      frameBudgetMs: 10,
    });
    const titles = Array.from({ length: 35 }, (_, i) =>
      fakeTitle(`${i}`, () => false),
    );
    titles.forEach(title => sizer.size(title));
    frames.run();
    frames.run();
    expect(titles.filter(title => title.style.fontSize).length).toEqual(10);
    expect(frames.pending()).toEqual(1);
    expect(frames.runAll()).toEqual(3);
    expect(titles.every(title => title.style.fontSize === '1.25rem')).toBe(
      true,
    );
  });

  test('requests one frame for many titles', () => {
    const frames = fakeFrames();
    const sizer = createTitleSizer<FakeTitle>(frames);
    for (let i = 0; i < 50; i++) {
      sizer.size(fakeTitle(`${i}`, () => false));
    }
    expect(frames.pending()).toEqual(1);
  });

  test('a title queued twice is sized once', () => {
    const frames = fakeFrames();
    const sizer = createTitleSizer<FakeTitle>(frames);
    const title = fakeTitle('a', () => false);
    sizer.size(title);
    sizer.size(title);
    frames.runAll();
    expect(title.writes).toEqual(['1.25rem']);
  });

  test('a cancelled title is not sized', () => {
    const frames = fakeFrames();
    const sizer = createTitleSizer<FakeTitle>(frames);
    const title = fakeTitle('a', () => false);
    sizer.size(title);
    sizer.cancel(title);
    frames.runAll();
    expect(title.writes).toEqual([]);
  });

  test('reports each title once its size is final', () => {
    const frames = fakeFrames();
    const sized: string[] = [];
    const sizer = createTitleSizer<FakeTitle>(frames, {
      onSized: title => sized.push(title.style.fontSize),
    });
    const title = fitting('a', 10);
    sizer.size(title);
    frames.runAll();
    expect(sized).toEqual([title.style.fontSize]);
    expect(sized.map(size => px(size, rootPx))).toEqual([
      legacy(sizePx => sizePx > 10).at(-1),
    ]);
  });
});

describe('observeTitle', () => {
  const frames: FrameRequestCallback[] = [];
  const runFrames = () => {
    while (frames.length > 0) {
      frames.shift()?.(0);
    }
  };
  const observed = new Set<Element>();
  let resize: (targets: Element[]) => void = () => {};

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = targets =>
            callback(
              targets.map(target => ({ target }) as ResizeObserverEntry),
              this as unknown as ResizeObserver,
            );
        }
        observe(target: Element) {
          observed.add(target);
        }
        unobserve(target: Element) {
          observed.delete(target);
        }
      },
    );
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    vi.stubGlobal('requestIdleCallback', (callback: () => void) =>
      frames.push(callback),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  function title(text: string) {
    const container = document.createElement('div');
    const title = document.createElement('p');
    title.textContent = text;
    container.append(title);
    document.body.append(container);
    return title;
  }

  test('writes an inline font-size on a later frame', () => {
    const action = title('Action');
    observeTitle(action);
    expect(action.style.fontSize).toEqual('');
    runFrames();
    expect(action.style.fontSize).toEqual('1.25rem');
    unobserveTitle(action);
  });

  test('re-sizes when the text changes', async () => {
    const action = title('Action');
    observeTitle(action);
    runFrames();
    action.style.fontSize = '1rem';
    (action.firstChild as Text).nodeValue = 'Une autre action';
    await Promise.resolve();
    runFrames();
    expect(action.style.fontSize).toEqual('1.25rem');
    unobserveTitle(action);
  });

  test('re-sizes when its container changes size, not after its own sizing', () => {
    const action = title('Action');
    const container = action.parentElement as HTMLElement;
    observeTitle(action);
    expect(observed.has(container)).toBe(false);
    runFrames();
    expect(observed.has(container)).toBe(true);

    action.style.fontSize = '1rem';
    resize([action, container]);
    runFrames();
    expect(action.style.fontSize).toEqual('1rem');

    Object.defineProperty(container, 'clientWidth', { value: 100 });
    resize([container]);
    runFrames();
    expect(action.style.fontSize).toEqual('1.25rem');
    unobserveTitle(action);
    expect(observed.size).toEqual(0);
  });

  test('stops after unobserveTitle', async () => {
    const action = title('Action');
    observeTitle(action);
    unobserveTitle(action);
    runFrames();
    expect(action.style.fontSize).toEqual('');
    action.textContent = 'Une autre action';
    await Promise.resolve();
    runFrames();
    expect(action.style.fontSize).toEqual('');
  });
});
