# Love Letter Website

A single-page interactive love letter. Visitors land on a sealed envelope, open
it, and the letter reveals itself.

## Features

- **Sealed envelope scene** with a 3D wax seal, floating heart particles, and
  paper grain texture
- **Press-to-open interaction** — click, tap, or press `Space` / `Enter`.
  The seal shatters, the flap folds back behind the envelope, and the letter
  slides out
- **Reveal sequence** on the letter card: the folk-art border, then the
  greeting, paragraphs, and signature stagger into view
- **Replay control** to close and re-read from the start
- **The card grows to fit the letter.** A short letter renders at exactly the
  reference greeting-card proportions (320:452). A long one stretches the card
  and the page scrolls normally, so the text is never trapped in a small
  scrolling box. The border bands stay pinned to the top and bottom.
- **No scrolling on the envelope screen** — `fitEnvelope()` sizes the envelope
  to whatever vertical space is left after the text and signature, so the
  scene fits every viewport from a 320×568 phone to 1920×1080
- Responsive down to small phones; respects `prefers-reduced-motion`; keyboard
  accessible with a visible focus ring

## Animation notes

The whole sequence is driven by variables at the top of the `<style>` block.
Each phase begins as the previous one settles, so nothing competes for the
compositor at the same moment:

```css
--t-seal:    200ms;   /* wax cracks                        */
--t-flap:    660ms;   /* flap swings up and folds behind   */
--t-letter: 1380ms;   /* letter slides out                 */
--t-exit:   2200ms;   /* envelope leaves, red blooms in    */
```

`--t-exit` is also read by the script, so changing it keeps JS and CSS in sync.

Two geometry details are load-bearing, and both were bugs once:

- The flap rotates to 180° **and** translates down by 115% of its own height,
  so the fold-back finishes inside the envelope's silhouette where the back
  panel hides it. Without that tuck the opened flap stood up above the top
  edge; because the flap is 100% of the envelope width against the letter's
  86%, its edges showed as stray cream triangles down both sides of the letter
  and under its bottom.
- The letter sheet occupies 6%–94% of the envelope's height. It used to be
  112% tall, which left about 43px of pink poking out below the bottom edge.

Both transform lists on the flap carry the same three functions
(`translateZ() translateY() rotateX()`), so the browser interpolates them
function-by-function rather than via a matrix decomposition.

The handwriting fades out as soon as the envelope starts to open, so the
letter rises into clear space rather than over the text.

## Layout notes

Two details in the letter layout are load-bearing:

- The container query lives on `.card-shell`, **not** `.card`. An element cannot
  use its own `cqw` units, and `padding` written in `%` on `.card` would resolve
  against the *scene's* width rather than the card's.
- Decoration bands are sized in `cqw` (a percentage of the card's **width**)
  rather than `%` of its height. Percentages of height would stretch the bands
  once the card grows tall to fit a long letter.

Because the card can be very tall, `.scene--letter` is the scroll container —
not the inner panel. `open()` resets the scroll there.

## Performance notes

The reveal is deliberately structured so the browser can composite it:

- The four decoration bands are **separate, tightly-cropped `<svg>` elements**
  rather than one big SVG. Animating an outermost `<svg>` is composited, while
  animating children *inside* an SVG repaints the whole SVG canvas every frame.
  Shared shapes live in a zero-size sprite `<svg>` and are pulled in via `<use>`.
- The paper grain is a **240px repeating tile**, not a full-viewport
  `feTurbulence` filter, and uses no `mix-blend-mode` (a blended full-screen
  layer forces a re-blend of the page on every frame).
- The idle "bob" sits on a plain 2D wrapper, not on the element that owns
  `perspective` — otherwise the whole 3D subtree re-projects every frame.
- **No `filter` sits on anything that animates.** The seal's shadow is a
  separate static element and the flap face has none, because a filter
  re-renders whenever its contents change — and the seal used to pulse
  forever *inside* its own drop-shadow.
- **No animation targets an inner SVG element.** The little heart on the
  sliding letter animates the outermost `<svg>`, which composites; on the
  inner `<path>` it repainted that SVG every frame during the 3D slide.
- Ambient loops (floating hearts, hint pulse) are **paused while the opening
  plays** via `animation-play-state`, then resume on close.
- Promoted layers are released via an `is-settled` class once everything stops.

Verify smoothness by sampling the live transform every `requestAnimationFrame`
and checking it changes on each frame — a screen recording can drop frames
independently of the browser, so duplicate captures prove nothing. Current
result: the flap advances on 42/43 frames and the letter on 47/47, with 2 of
274 frames slower than 33ms.

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
  greeting: 'To the person who once meant the world to me, Nissa',
  paragraphs: [
    'Your first paragraph here.',
    'Your second paragraph here.',
  ],
  closing: 'thank you, always.',
  name: 'syafiq',
  kiss: ''          // '' hides the line entirely
};
```

Add or remove paragraphs freely. The reveal staggers automatically based on how
many you supply, and the card grows to fit — no fixed limit on length.

The envelope's own two texts live in the markup, not in that object:

- the handwriting, in `.script-top`
- the signature, in `.signature__love` / `.signature__name`

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