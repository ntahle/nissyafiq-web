/**
 * Cloudflare Pages Function — notifies via Telegram whenever the letter is
 * opened.
 *
 * Everything here is server-side, so the page itself stays a single static
 * file with no tracking script and nothing visible in the browser.
 *
 * The fiddly part is telling a real open apart from a link preview. When you
 * send the URL in WhatsApp or Telegram, those apps fetch the page themselves
 * to build the preview card — before she ever taps it. Ping on those and
 * you'd get "she opened it" the moment you hit send.
 *
 * The reliable signal is the rendering engine. Link-preview fetchers send a
 * bare product token:
 *     WhatsApp/2.23.20.0
 *     TelegramBot (like TwitterBot)
 *     facebookexternalhit/1.1
 *     Slackbot-LinkExpanding 1.0
 * A real browser always declares Mozilla/5.0 *and* an engine (Chrome/,
 * Safari/, Firefox/...). That distinction matters because the WhatsApp and
 * Telegram IN-APP BROWSERS also contain "WhatsApp"/"Telegram" — so matching
 * on those names would throw away her genuine visits. We never match them.
 *
 * Requires two Pages environment variables (Production):
 *   TELEGRAM_TOKEN    — from @BotFather
 *   TELEGRAM_CHAT_ID  — your numeric chat id
 * With either missing the function quietly does nothing.
 */

const CRAWLER = /facebookexternalhit|Googlebot|bingbot|YandexBot|DuckDuckBot|Baiduspider|Slackbot|Discordbot|Twitterbot|LinkedInBot|Embedly|HeadlessChrome|Lighthouse|Pingdom|UptimeRobot|W3C_Validator|AhrefsBot|SemrushBot|PetalBot/i;

/**
 * True only for something that looks like a real person's browser.
 *
 * Deliberately biased toward letting things through. A false positive just
 * means one spurious notification when you send the link; a false negative
 * means her actual open goes unreported, which defeats the whole point.
 */
function isRealBrowser(ua) {
  if (!ua) return false;

  // Link-preview fetchers send a bare product token and no Mozilla/:
  //   WhatsApp/2.23.20.0          TelegramBot (like TwitterBot)
  //   facebookexternalhit/1.1     Slackbot-LinkExpanding 1.0
  if (!/Mozilla\/5\.0/.test(ua)) return false;

  // A few crawlers do spoof a full browser UA.
  if (CRAWLER.test(ua)) return false;

  // A named engine token: normal desktop and mobile browsers.
  if (/(Chrome|CriOS|Safari|Firefox|FxiOS|EdgA?|SamsungBrowser|OPR)\//.test(ua)) return true;

  // WKWebView-based in-app browsers — Telegram, Instagram, Facebook on iOS —
  // declare AppleWebKit but NO Safari/ token, because they are not Safari.
  // Apple's iMessage preview fetcher sends an almost identical UA, so the
  // thing that separates them is the device: in-app browsers are iPhone/iPad/
  // Android, the preview fetcher says Macintosh.
  if (/AppleWebKit\//.test(ua) && /(iPhone|iPad|iPod|Android)/.test(ua)) return true;

  return false;
}

/** Should this request count as "someone opened the letter"? */
function isOpen(request, response) {
  // only a real page navigation
  if (request.method !== 'GET') return false;
  // a Pages 404 is served as text/html, so a scanner hitting /wp-login.php
  // would otherwise look exactly like someone opening the letter
  if (response.status !== 200) return false;
  if (!(response.headers.get('content-type') || '').includes('text/html')) return false;
  const accept = request.headers.get('accept') || '';
  if (accept && !accept.includes('text/html')) return false;
  // browsers sometimes speculatively prefetch a link before it is clicked
  const purpose = request.headers.get('sec-purpose') || request.headers.get('purpose') || '';
  if (/prefetch|prerender/i.test(purpose)) return false;
  return isRealBrowser(request.headers.get('user-agent') || '');
}

function deviceOf(ua) {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows';
  return 'unknown device';
}

function browserOf(ua) {
  if (/EdgA?\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet';
  if (/CriOS\//.test(ua)) return 'Chrome (iOS)';
  if (/FxiOS\//.test(ua)) return 'Firefox (iOS)';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return '';
}

/** Fire-and-forget. Must never be able to break the page. */
async function notify(request, env) {
  try {
    const token = env.TELEGRAM_TOKEN;
    const chat = env.TELEGRAM_CHAT_ID;
    if (!token || !chat) return;

    const cf = request.cf || {};
    const ua = request.headers.get('user-agent') || '';

    const when = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kuala_Lumpur',
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const where = [cf.city, cf.country].filter(Boolean).join(', ') || 'location unknown';
    const device = [deviceOf(ua), browserOf(ua)].filter(Boolean).join(' · ');

    const text = '💌 The letter was opened\n' + when + '\n' + where + '\n' + device;

    await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text }),
    });
  } catch (e) {
    // swallow everything: a Telegram hiccup must never reach the visitor
  }
}

export async function onRequest(context) {
  const { request, env, next, waitUntil } = context;

  // let Pages serve the real response first, so we only ping on a genuine
  // 200 text/html hit rather than on a 404 or an asset
  const response = await next();

  try {
    if (isOpen(request, response) && env.TELEGRAM_TOKEN && env.TELEGRAM_CHAT_ID) {
      const job = notify(request, env);
      if (waitUntil) waitUntil(job);
      else job.catch(() => {});
    }
  } catch (e) {
    // never let notification bookkeeping affect the response
  }

  return response;
}
