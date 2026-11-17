import { test, expect } from '../support/test';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { demoRows, prepareDemo, setTemplate, settle } from '../support/demo-page';

// Each fixture jpg has a distinct pixel width, so an image painted in the PDF maps back to its row.
const imageWidths: Record<string, number> = {
  '1': 410, '2': 420, '3': 430, '4': 440, '5': 450, '6': 460, '7': 470, '8': 480, '10': 270, '11 bis': 1000,
};
const actionWords: Record<string, string> = {
  '1': 'Ouverture', '2': 'Deuxième', '3': 'Anticonstitutionne', '5': 'Soleil', '6': 'Plan',
  '7': 'Autre', '8': 'Midi', '9': 'Image', '10': 'Portrait', '11 bis': 'Panorama',
};
const expectedPages = { small: 2, large: 3 };

type PdfPage = { texts: string[]; imageWidths: number[]; fonts: string[] };

async function readPdf(buffer: Buffer): Promise<PdfPage[]> {
  const pdf = await getDocument({ data: new Uint8Array(buffer), fontExtraProperties: true }).promise;
  const pages: PdfPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    const operators = await page.getOperatorList();
    const widths: number[] = [];
    const fonts = new Set<string>();
    operators.fnArray.forEach((fn, index) => {
      if (fn === OPS.paintImageXObject) {
        const id = operators.argsArray[index][0];
        const image = id.startsWith('g_') ? page.commonObjs.get(id) : page.objs.get(id);
        widths.push(image.width);
      }
      if (fn === OPS.setFont) {
        // Embedded fonts are subsets named like AAAAAA+CourierPrime-Bold.
        fonts.add(page.commonObjs.get(operators.argsArray[index][0]).name.replace(/^[A-Z]{6}\+/, ''));
      }
    });
    pages.push({
      // Words, not text items: how pdf.js groups words into items depends on the font's spacing.
      texts: text.items.flatMap(item => ('str' in item ? item.str.split(/\s+/) : [])).filter(s => s.length > 0),
      imageWidths: widths,
      fonts: [...fonts],
    });
  }
  return pages;
}

for (const template of ['small', 'large'] as const) {
  test(`print to PDF: ${template}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'page.pdf is Chromium only');
    await prepareDemo(page);
    await setTemplate(page, template);
    await settle(page);
    await page.emulateMedia({ media: 'print' });

    const pages = await readPdf(await page.pdf({ format: 'A4', printBackground: true }));

    expect(pages).toHaveLength(expectedPages[template]);
    // The demo has no font of its own, so its tiles print in --pg-font-mono's web font, not a system fallback.
    expect(new Set(pages.flatMap(p => p.fonts))).toEqual(new Set(['CourierPrime-Regular', 'CourierPrime-Bold']));
    for (const row of demoRows) {
      const sequence = row.split(' ');
      const textPages = pages.filter(p => sequence.every(part => p.texts.includes(part)));
      expect(textPages.length, `pages with sequence ${row}`).toBeGreaterThan(0);
      const width = imageWidths[row];
      if (width === undefined) {
        continue;
      }
      const imagePages = pages.filter(p => p.imageWidths.includes(width));
      expect(imagePages, `pages painting the image of row ${row}`).toHaveLength(1);
      expect(imagePages[0].imageWidths.filter(w => w === width), `paints of row ${row}`).toHaveLength(1);
      expect(sequence.every(part => imagePages[0].texts.includes(part)), `sequence ${row} next to its image`).toBe(true);
      const word = actionWords[row];
      if (word !== undefined) {
        expect(imagePages[0].texts.some(t => t.includes(word)), `action of row ${row} next to its image`).toBe(true);
      }
    }
    // One image per tile, its own: the icons print as vector paths, not as images.
    expect(pages.flatMap(p => p.imageWidths)).toHaveLength(demoRows.length);
    for (const [row, word] of Object.entries(actionWords)) {
      expect(pages.some(p => p.texts.some(t => t.includes(word))), `action of row ${row}`).toBe(true);
    }
  });
}
