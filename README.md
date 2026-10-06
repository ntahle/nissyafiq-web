# Love Letter Website

A single-page interactive love letter. Visitors land on a sealed envelope, open
it, and the letter reveals itself.

## Features

- **Sealed envelope scene** with a 3D flower-shaped wax seal that cracks and
  throws off flowers, drifting flower particles, and  paper grain texture
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

The whole sequence is driven by variables at the top of the `<style>` block,
and is matched to a reference clip of the envelope opening and closing:

```css
--t-flap:    150ms;    /* flap starts almost at once        */
--dur-flap: 1000ms;    /*   ~1.0s                           */
--t-letter:  950ms;    /* letter follows as the flap lands  */
--dur-letter: 700ms;   /*   ~0.7s                           */
--t-exit:   2000ms;    /* short hold, then the big reveal   */
```

**Open and close are a different order, not a rewind.** The flap leads on the
way out and the letter leads on the way back:

- OPEN: flap swings up (~1.0s), then the letter rises out of the envelope.
- CLOSE: the letter drops back in (~0.9s), then the flap swings shut (~1.2s).

This works because the open timings live on the `.is-opening` / `.is-open`
rules while the close timings live on the **base** rules — when a state class is
removed, the transition that runs is the one on the element's *new* style.

The letter only rises about half way and stops, still part in the mouth of the
envelope, exactly as in the reference. It does not come fully out.

The wax seal is split into two halves by a `clip-path` so it can crack. Two
things about that are load-bearing:

- The clip must sit on the **same element as the transform**. Put it on an
  untransformed wrapper and it stays put while the half slides out of it, so
  the half gets sliced to a sliver instead of flying apart whole.
- The two clip rects must **overlap** across the centre line. Abutting them
  exactly at `x=0` left an antialiased seam that ran straight up the middle of
  the top petal, making the closed seal look panelised.

Four more details here are load-bearing, and every one of them was a bug first:
- The flap's transform list must carry the **same three functions** as the
  closed pose (`translateZ() translateY() rotateX()`), or the browser falls
  back to matrix decomposition instead of interpolating function-by-function.
- The opened flap must **not** tuck behind the envelope. It did once, to hide
  wedges showing either side of the letter — but that only looked wrong while
  the letter slid almost fully out and exposed the flap's wide base. With the
  letter stopping half way, its own body covers the flap's middle and only the
  two small tips flank it, as in the reference.
- The flap's back face carries its own `rotateX(180deg)`, so the parent's 180°
  is *un-mirrored* there and the net effect is a pure upward translation. Its
  triangle therefore has to be drawn **apex-up**; drawn apex-down like the
  front face, the opened flap renders inverted, pointing down at the envelope.
- The flap's inner face is deliberately a warmer tan (`--paper-shade`). At the
  original `#F1ECE0` it differed from the page by only 17/255, so the flap
  rendered correctly but was invisible in practice.

`close()` is a real third state. It cannot be interrupted, or the flap snaps
while the letter is mid-slide.

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

## Ambient effects

- **Wax shimmer** — a soft band of light sweeps across the seal every few
  seconds, clipped to the flower's silhouette. The clip geometry is repeated
  inside `#waxClip` rather than `<use>`-referencing the blob: a clipPath child
  pointing at a `<g>` of shapes is not reliably supported. The band's gradient
  is `objectBoundingBox` so it travels with the rect; with `userSpaceOnUse` the
  rect slides underneath a stationary band.
- **Glints** — pale sparkles that pop and fade, positioned **on the wax**. This
  matters: the seal's blob is only ~40px across while the wrapper is ~420px
  wide, so an offset over ~8% puts a pale glint on cream paper where it is
  invisible. They are cream, not red, for the same reason — a red sparkle on a
  cream page reads as a stray mark rather than as light.
- **Cursor parallax** — the envelope leans up to 2.2° toward the pointer, on a
  wrapper between the bob and the 3D envelope so it does not fight either.
  Skipped entirely on touch (`hover: none`).
- **Falling petals** over the open letter, and a **sound toggle** (bottom
  right). Sound is synthesised with WebAudio, so the page stays a single file
  with no audio assets, and nothing is created until a real user gesture.
  The mute preference persists in `localStorage`.

## The sound

It is **paper, not music** — every cue is filtered noise, with no oscillators
at all. Paper has no pitch; it is broadband noise with a granular envelope.

Softness is deliberate, and it comes from five places at once:

- **A soft attack.** Every cue eases in over the first 20% (smoothstep).
  A near-instant attack is most of what makes noise read as a hard snap.
- **Smoothed grains.** The noise is broken into short random grains (2.5–10 ms)
  of varying weight, but the amplitude is one-pole smoothed across grain
  boundaries. Stepping it outright puts a click at every boundary, and those
  clicks are what made the texture brittle.
- **A lowpass** at 3400–3800 Hz. Rolling the top off is the single biggest
  lever against filtered noise sounding thin and brittle.
- **Low bands.** Highpass 300–400 Hz (enough to kill rumble without going
  thin), bandpass 520–1800 Hz.
- **Low levels.** Source peaks sit around 0.6–0.8 of full scale, and the gain
  stage takes them to roughly 0.03–0.07.

Two cues sweep their band, which is what makes a sheet sliding sound like a
slide rather than a static hiss.

Measured: spectral flatness 0.52–0.59 (a pure tone sits near 0.01), zero
oscillators, no cue reaches full level in the first 5% of its length.

## Open notification

The page pushes to **ntfy** (`ntfy.sh/nissyafiq`) when the letter is opened.
Subscribe to that topic in the ntfy app to get it on your phone, or open
`https://ntfy.sh/nissyafiq` in a browser to see the recent list. No account and
no key — the topic name is the only identifier.

There is no email and no server-side code involved, which removes a whole class
of failure: no sending domain, no spam filtering, no verification step. Nothing
that can silently swallow a notification while still reporting success.

Running in the browser also removes the need for crawler detection: WhatsApp and
Telegram build their link-preview cards by fetching the page **without executing
JavaScript**, so a preview fetch can never trigger a notification. Only a real
browser gets that far.

The payload contains only the time, a rough device/browser guess and the screen
size. Nothing about the visitor is collected and no IP is sent.

Two things to know:

- The topic name is public — it sits in the page source, so anyone who reads it
  could send nuisance notifications. That is the entire worst case.
- ntfy.sh keeps free-tier messages for **12 hours**, so the topic page is a
  recent view rather than a permanent log.

This page is hosted as **Workers Static Assets**, not Pages, so there is no
Worker script and repo variables cannot be set — which is why the notification
lives in the page rather than server-side.

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
- Ambient loops (drifting flowers, hint pulse) are **paused while the opening
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