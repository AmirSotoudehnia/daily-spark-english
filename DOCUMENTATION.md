# Daily Spark — Chrome Extension Documentation

## Overview

Two Chrome extensions built with Manifest V3. Each shows a daily quote, live weather, and top news in a popup — no background scripts, no content scripts, no API keys required.

- **daily-quote-extension** — Persian poetry (RTL, Vazirmatn font, purple theme)
- **daily-spark-english** — English motivational quotes (LTR, Inter font, orange theme)

---

## File Structure

```
daily-spark-english/          daily-quote-extension/
├── manifest.json             ├── manifest.json
├── popup.html                ├── popup.html
├── popup.css                 ├── popup.css
├── popup.js                  ├── popup.js
├── quotes.js                 ├── quotes.js
└── icons/                    └── icons/
    ├── icon16.png                ├── icon16.png
    ├── icon48.png                ├── icon48.png
    └── icon128.png               └── icon128.png
```

| File | Purpose |
|------|---------|
| `manifest.json` | Extension config — name, version, permissions, popup entry point |
| `popup.html` | UI shell — three card sections: quote, weather, news |
| `popup.css` | Dark theme styling with Google Fonts |
| `popup.js` | Fetches weather + news, manages cache, renders UI |
| `quotes.js` | Hardcoded quote list + daily selection logic |

---

## How Each Feature Works

### Daily Quote

Quotes are stored locally in `quotes.js` — no API needed. A deterministic index is derived from today's date string so every user sees the same quote all day and it changes automatically at midnight:

```js
const idx = Math.abs(
  today.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
) % QUOTES.length;
```

The result is cached in `localStorage` keyed by date to avoid recalculating on every popup open.

---

### Weather

Uses two free APIs with no registration required:

1. **Browser Geolocation API** — asks the user for GPS coordinates
2. **Open-Meteo** (`api.open-meteo.com`) — returns current temperature, weather code, wind speed, humidity
3. **Nominatim** (`nominatim.openstreetmap.org`) — reverse-geocodes coordinates into a city name

Weather data is cached for **30 minutes** in `chrome.storage.local`. If the user denies location access, a friendly message is shown.

---

### News

Uses the **Hacker News Firebase API** — fully free, no key, no rate limits for normal use:

1. Fetch top 500 story IDs: `hacker-news.firebaseio.com/v0/topstories.json`
2. Fetch details for the first 8 IDs in parallel
3. Render title, score, and author with a link to the original article

News is cached for **60 minutes** in `chrome.storage.local`.

---

### Cache System

Both weather and news use a lightweight TTL cache on top of `chrome.storage.local`:

```js
// Structure stored per key:
{ data: <payload>, ts: <timestamp ms>, ttl: <minutes> }

// On read: skip fetch if (now - ts) / 60000 < ttl
```

This prevents redundant network calls every time the popup opens.

---

## APIs Used

| Service | Used For | Cost | API Key |
|---------|----------|------|---------|
| Open-Meteo | Weather data | Free | None |
| Nominatim (OpenStreetMap) | City name from GPS | Free | None |
| Hacker News Firebase API | Top 8 news stories | Free | None |

---

## Permissions

```json
"permissions": ["geolocation", "storage"]
```

| Permission | Reason |
|------------|--------|
| `geolocation` | Required to get the user's coordinates for weather |
| `storage` | Used for TTL caching of weather and news data |

---

## Installation (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the extension folder (`daily-spark-english` or `daily-quote-extension`)
5. The extension icon appears in the toolbar — click it to open the popup

---

## Publishing to Chrome Web Store (Optional)

1. Go to [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time $5 developer registration fee
3. Zip the extension folder:
   ```bash
   zip -r daily-spark-english.zip daily-spark-english/
   ```
4. Upload the ZIP, fill in store listing details (description, screenshots)
5. Submit for review — Google typically approves within 1–3 business days
