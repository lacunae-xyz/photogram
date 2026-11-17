import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './pg-card';

afterEach(() => render(null, document.body));

async function renderCard(template: ReturnType<typeof html>) {
  render(template, document.body);
  const card = document.body.querySelector('pg-card');
  if (!card) throw new Error('no pg-card');
  await card.updateComplete;
  return card;
}

function actions(card: HTMLElement) {
  return card.shadowRoot!.querySelector<HTMLElement>('.actions')!;
}

describe('pg-card', () => {
  it('shows the heading as text without an href', async () => {
    await renderCard(html`<pg-card heading="Le fardeau"></pg-card>`);
    await expect.element(page.getByText('Le fardeau')).toBeVisible();
    await expect.element(page.getByRole('link')).not.toBeInTheDocument();
  });

  it('links the heading to its href', async () => {
    const card = await renderCard(
      html`<pg-card heading="Le fardeau" href="/project/1"></pg-card>`,
    );
    await expect
      .element(page.getByRole('link', { name: 'Le fardeau' }))
      .toHaveAttribute('href', '/project/1');
    card.heading = 'Court-métrage';
    await card.updateComplete;
    await expect
      .element(page.getByRole('link', { name: 'Court-métrage' }))
      .toBeVisible();
  });

  it('puts the media, badge and actions in their slots', async () => {
    const card = await renderCard(
      html`<pg-card heading="Le fardeau">
        <img slot="media" alt="cover" />
        <span slot="badge">badge</span>
        <button slot="actions">Delete</button>
      </pg-card>`,
    );
    const slotted = (name: string) =>
      card
        .shadowRoot!.querySelector<HTMLSlotElement>(`slot[name=${name}]`)!
        .assignedElements()
        .map(element => element.textContent || element.getAttribute('alt'));
    expect(slotted('media')).toEqual(['cover']);
    expect(slotted('badge')).toEqual(['badge']);
    expect(slotted('actions')).toEqual(['Delete']);
  });

  it('draws the badge circle only around a badge', async () => {
    const card = await renderCard(
      html`<pg-card heading="Le fardeau"></pg-card>`,
    );
    const badge = card.shadowRoot!.querySelector<HTMLElement>('.badge')!;
    expect(badge.checkVisibility()).toBe(false);
    const icon = document.createElement('span');
    icon.slot = 'badge';
    icon.textContent = 'badge';
    card.append(icon);
    await vi.waitFor(() => expect(badge.checkVisibility()).toBe(true));
    icon.remove();
    await vi.waitFor(() => expect(badge.checkVisibility()).toBe(false));
  });

  it('keeps the heading centred beside the actions', async () => {
    const card = await renderCard(
      html`<pg-card heading="Le fardeau" style="width: 240px">
        <button slot="actions" style="width: 40px">Delete</button>
      </pg-card>`,
    );
    const centre = (element: Element) => {
      const { left, width } = element.getBoundingClientRect();
      return left + width / 2;
    };
    const heading = card.shadowRoot!.querySelector('.heading')!;
    expect(centre(heading)).toBeCloseTo(centre(card), 0);
  });

  it('shows the actions on hover', async () => {
    const card = await renderCard(
      html`<pg-card heading="Le fardeau" style="width: 200px">
        <button slot="actions">Delete</button>
      </pg-card>`,
    );
    expect(getComputedStyle(actions(card)).opacity).toBe('0');
    await userEvent.hover(card);
    await vi.waitFor(() =>
      expect(getComputedStyle(actions(card)).opacity).toBe('1'),
    );
  });

  it('shows the actions when the keyboard reaches them', async () => {
    const card = await renderCard(
      html`<pg-card heading="Le fardeau" href="/project/1">
        <button slot="actions">Delete</button>
      </pg-card>`,
    );
    await userEvent.tab();
    expect(card.shadowRoot!.activeElement).toBe(
      card.shadowRoot!.querySelector('a'),
    );
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('Delete');
    await vi.waitFor(() =>
      expect(getComputedStyle(actions(card)).opacity).toBe('1'),
    );
  });
});
