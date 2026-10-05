# Love Letter Website

A single-page interactive love letter. Visitors land on a sealed envelope, open
it, and the letter reveals itself.

## Features

- **Sealed envelope scene** with a 3D wax seal, floating heart particles, and
  paper grain texture
- **Press-to-open interaction** — click, tap, or press `Space` / `Enter`.
  The seal shatters, the flap swings open, and the letter slides out
- **Reveal sequence** on the letter card: the folk-art border decorates pop in
  one by one, then the greeting, paragraphs, and signature stagger into view
- **Replay control** to close and re-read from the start
- Responsive down to small phones; respects `prefers-reduced-motion`; keyboard
  accessible with a visible focus ring

## Design references

The envelope and letter card are recreations of the artwork in this repo:

- `letter envelop.jpg`
- `letter content.jpg`

Colours were sampled directly from those images (cream `#FAF8F1`, red
`#E24140`, pink `#F78FAF`, blush `#F6DCD6`, burgundy `#7A2D28`).

## Customising the letter

Everything you'll want to change lives in a single object at the top of the
`<script>` block in `index.html`:

```js
const LETTER = {
  greeting: 'Dear Love,',
  paragraphs: [
    'Your first paragraph here.',
    'Your second paragraph here.',
  ],
  closing: 'Forever yours,',
  name: 'Henry',
  kiss: 'xx'
};
```

Add or remove paragraphs freely — the reveal animation staggers automatically
based on how many you supply, and long text scrolls inside the inner panel.

Text colours and the border palette are grouped as CSS custom properties at the
top of the `<style>` block.

## Running it locally

It's a static single file, so open `index.html` directly, or serve it:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying

Push to GitHub and enable **Settings → Pages → Source: Deploy from a branch**
(select `main` / root) to publish it at
`https://ntahle.github.io/nissyafiq-web/`.

The only external dependency is Google Fonts; everything else is inlined.

## Browser support

Modern browsers. Uses container queries, CSS nesting-free custom properties,
and 3D transforms.