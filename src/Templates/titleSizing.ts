const minRem = 0.125;
const maxRem = 1.25;
const thresholdRem = 0.03125;

type Search = Readonly<{
  phase: 'max' | 'min' | 'half';
  size: number;
  lo: number;
  hi: number;
}>;

const firstSearch: Search = {
  phase: 'max',
  size: maxRem,
  lo: minRem,
  hi: maxRem,
};

function half(lo: number, hi: number): Search {
  return { phase: 'half', size: lo + (hi - lo) / 2, lo, hi };
}

/**
 * The next size to try after measuring `search.size`, or undefined when `search.size` is the answer.
 * Same steps, in the same floating-point order, as the old FontSizeAdjuster: max, then min, then halving.
 */
function nextSearch(search: Search, overflows: boolean): Search | undefined {
  switch (search.phase) {
    case 'max':
      return overflows ? { ...search, phase: 'min', size: minRem } : undefined;
    case 'min':
      return overflows ? undefined : half(minRem, maxRem);
    case 'half':
      if (overflows) {
        return half(search.lo, search.size);
      }
      return search.hi - search.lo > thresholdRem
        ? half(search.size, search.hi)
        : undefined;
  }
}

export interface Title {
  readonly style: { fontSize: string };
  readonly parentElement: {
    readonly scrollHeight: number;
    readonly clientHeight: number;
  } | null;
}

function overflows(title: Title) {
  const container = title.parentElement;
  return container !== null && container.scrollHeight > container.clientHeight;
}

export type Frames = {
  request(callback: () => void): void;
  /**
   * Like `request`, but leaves the next frame free of our script. After a large render that frame lays out every new
   * title, and any script in it, even an empty callback, makes the whole frame count as a long task.
   */
  requestAfterNext(callback: () => void): void;
  now(): number;
};

export type SizerOptions<T> = {
  /** Titles searched together: one forced layout per search step for the whole batch. */
  batchSize?: number;
  /** Batches started in one frame stop once this much time has passed; the rest waits for the next frame. */
  frameBudgetMs?: number;
  /** Called while layout is still clean after the title's last measure. */
  onSized?: (title: T) => void;
};

/**
 * Sizes queued titles on the next frames. Each search step writes the font-size of every title in a batch, then
 * reads all their containers, so a batch costs one layout per step instead of one per title per step.
 */
export function createTitleSizer<T extends Title>(
  frames: Frames,
  { batchSize = 100, frameBudgetMs = 10, onSized }: SizerOptions<T> = {},
) {
  const queue = new Set<T>();
  let scheduled = false;

  function search(batch: T[]) {
    let pending = batch.map(title => ({ title, search: firstSearch }));
    while (pending.length > 0) {
      for (const { title, search } of pending) {
        title.style.fontSize = search.size + 'rem';
      }
      const measures = pending.map(({ title }) => overflows(title));
      const next: typeof pending = [];
      pending.forEach(({ title, search }, i) => {
        const following = nextSearch(search, measures[i]);
        if (following) {
          next.push({ title, search: following });
        } else {
          onSized?.(title);
        }
      });
      pending = next;
    }
  }

  function frame() {
    scheduled = false;
    const start = frames.now();
    while (queue.size > 0 && frames.now() - start < frameBudgetMs) {
      const batch: T[] = [];
      for (const title of queue) {
        if (batch.length === batchSize) {
          break;
        }
        batch.push(title);
      }
      batch.forEach(title => queue.delete(title));
      search(batch);
    }
    if (queue.size > 0) {
      scheduled = true;
      frames.request(frame);
    }
  }

  return {
    size(title: T) {
      queue.add(title);
      if (!scheduled) {
        scheduled = true;
        frames.requestAfterNext(frame);
      }
    },
    cancel(title: T) {
      queue.delete(title);
    },
    isQueued(title: T) {
      return queue.has(title);
    },
  };
}

let observer: ReturnType<typeof createObserver> | undefined;

function createObserver() {
  const containers = new Map<HTMLElement, HTMLElement | null>();
  const titlesByTarget = new WeakMap<Element, HTMLElement>();
  const layouts = new WeakMap<HTMLElement, string>();

  const layout = (title: HTMLElement) => {
    const container = title.parentElement;
    return `${container?.clientWidth}×${container?.clientHeight}×${title.offsetHeight}`;
  };

  const sizer = createTitleSizer<HTMLElement>(
    {
      request: callback => requestAnimationFrame(callback),
      requestAfterNext: callback => {
        const next = () => requestAnimationFrame(callback);
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(next, { timeout: 100 });
        } else {
          setTimeout(next);
        }
      },
      now: () => performance.now(),
    },
    {
      onSized: title => {
        if (!layouts.has(title)) {
          watch(title);
        }
        layouts.set(title, layout(title));
      },
    },
  );

  // Our own font-size writes resize the title too: only a layout that differs from the one recorded after sizing
  // (a new container size, or another font) re-sizes it. Layout is clean in a ResizeObserver callback, so reads are free.
  const resizes = new ResizeObserver(entries => {
    const titles = new Set<HTMLElement>();
    for (const { target } of entries) {
      const title = titlesByTarget.get(target);
      if (title && containers.has(title) && !sizer.isQueued(title)) {
        titles.add(title);
      }
    }
    for (const title of titles) {
      if (layout(title) !== layouts.get(title)) {
        sizer.size(title);
      }
    }
  });

  const texts = new MutationObserver(records => {
    for (const { target } of records) {
      let node: Node | null = target;
      while (node && !containers.has(node as HTMLElement)) {
        node = node.parentNode;
      }
      if (node) {
        sizer.size(node as HTMLElement);
      }
    }
  });

  // Only once sized: observing the titles of a large first render would put a ResizeObserver callback in the frame
  // that lays them all out, and make that frame a long task.
  function watch(title: HTMLElement) {
    const container = containers.get(title);
    titlesByTarget.set(title, title);
    resizes.observe(title);
    if (container) {
      titlesByTarget.set(container, title);
      resizes.observe(container);
    }
  }

  document.fonts?.addEventListener('loadingdone', () => {
    for (const title of containers.keys()) {
      sizer.size(title);
    }
  });

  return {
    observe(title: HTMLElement) {
      const container = title.parentElement;
      containers.set(title, container);
      texts.observe(title, {
        characterData: true,
        childList: true,
        subtree: true,
      });
      sizer.size(title);
    },
    unobserve(title: HTMLElement) {
      const container = containers.get(title);
      containers.delete(title);
      layouts.delete(title);
      sizer.cancel(title);
      resizes.unobserve(title);
      if (container) {
        resizes.unobserve(container);
      }
    },
  };
}

/**
 * Keeps `title`'s inline font-size the largest that fits its parent, between .125 and 1.25 rem: now, and again when the
 * title's text, its parent's size or the fonts change. Call `unobserveTitle` when the title leaves the document.
 */
export function observeTitle(title: HTMLElement) {
  observer ??= createObserver();
  observer.observe(title);
}

export function unobserveTitle(title: HTMLElement) {
  observer?.unobserve(title);
}
