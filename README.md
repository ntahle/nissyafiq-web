# Love Letter Website

A single-page interactive love letter. Visitors land on a sealed envelope, open
it, and the letter reveals itself.

## Features

- **Sealed envelope scene** with a 3D wax seal, floating heart particles, and
  paper grain texture
- **Press-to-open interaction** — click, tap, or press `Space` / `Enter`.
  The seal shatters, the flap swings open, and the letter slides out
- **Reveal sequence** on the letter card: the folk-art border, then the
  greeting, paragraphs, and signature stagger into view
- **Replay control** to close and re-read from the start
- **No scrolling on the envelope screen** — `fitEnvelope()` sizes the envelope
  to whatever vertical space is left after the text and signature, so the
  scene fits every viewport from a 320×568 phone to 1920×1080
- Responsive down to small phones; respects `prefers-reduced-motion`; keyboard
  accessible with a visible focus ring

## Retuning the animation

The whole opening sequence is driven by variables at the top of the `<style>`
block. Each phase begins as the previous one settles, so nothing competes for
the compositor at the same moment:

```css
--t-seal:    200ms;   /* wax cracks                     */
--t-flap:    640ms;   /* flap swings up                 */
--t-letter: 1300ms;   /* letter slides out              */
--t-exit:   2180ms;   /* envelope leaves, red blooms in */
```

`--t-exit` is also read by the script, so changing it keeps JS and CSS in sync.

## Performance notes

The reveal is deliberately structured so the browser can composite it:

- The three decoration bands are **separate, tightly-cropped `<svg>` elements**
  rather than one big SVG. Animating an outermost `<svg>` is composited, while
  animating children *inside* an SVG repaints the whole SVG canvas every frame.
  Shared shapes live in a zero-size sprite `<svg>` and are pulled in via `<use>`.
- The paper grain is a **240px repeating tile**, not a full-viewport
  `feTurbulence` filter, and uses no `mix-blend-mode` (a blended full-screen
  layer forces a re-blend of the page on every frame).
- The idle "bob" sits on a plain 2D wrapper, not on the element that owns
  `perspective` — otherwise the whole 3D subtree re-projects every frame.
- Promoted layers are released via an `is-settled` class once everything stops.

Measured with Chrome DevTools Protocol under 4× CPU throttling (desktop) and
6× (mobile): 0 long tasks on desktop, 1 on mobile.

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