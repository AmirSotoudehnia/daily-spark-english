# ✨ Daily Spark — Chrome Extension

A lightweight Chrome extension that greets you every day with a **motivational quote**, **live local weather**, and **top news headlines** — all in one clean popup. No sign-up, no API keys, completely free.

---

## Preview

| Section | Description |
|---------|-------------|
| 💬 Quote of the Day | A new motivational quote every day from icons like Einstein, Mandela, Jobs, and more |
| 🌤 Weather | Real-time temperature, conditions, wind, and humidity based on your location |
| 📰 Top News | 8 trending stories from Hacker News, updated hourly |

---

## Features

- ✅ **Daily quote** — changes automatically at midnight, stays consistent all day
- ✅ **Live weather** — uses your browser's GPS; no API key needed
- ✅ **Top news** — pulls from Hacker News public API; no API key needed
- ✅ **Smart caching** — weather cached 30 min, news cached 60 min to avoid redundant requests
- ✅ **Dark theme UI** — clean, minimal popup with smooth animations
- ✅ **No tracking, no accounts, no data collection**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension Platform | Chrome Extensions **Manifest V3** |
| UI | HTML5 + CSS3 (CSS variables, keyframe animations) |
| Font | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Logic | Vanilla JavaScript (ES2020) — no frameworks, no dependencies |
| Weather API | [Open-Meteo](https://open-meteo.com/) — free, no key required |
| Geocoding API | [Nominatim](https://nominatim.openstreetmap.org/) (OpenStreetMap) — free, no key required |
| News API | [Hacker News Firebase API](https://github.com/HackerNews/API) — free, no key required |
| Storage | `chrome.storage.local` for TTL-based caching |
| Location | Browser Geolocation API |

---

## File Structure

```
daily-spark-english/
│
├── manifest.json       # Extension manifest (Manifest V3) — permissions, metadata, popup entry
├── popup.html          # Main UI — three card layout: quote, weather, news
├── popup.css           # Dark theme styles, animations, Google Fonts
├── popup.js            # Core logic — fetches weather & news, manages cache, renders UI
├── quotes.js           # 40 hardcoded motivational quotes + daily selection algorithm
│
└── icons/
    ├── icon16.png      # Toolbar icon
    ├── icon48.png      # Extensions page icon
    └── icon128.png     # Chrome Web Store icon
```

---

## How It Works

### Quote of the Day

Quotes are stored locally inside `quotes.js` — no network call needed. A deterministic index is calculated from today's date string so the quote is the same all day and changes automatically at midnight:

```js
const idx = Math.abs(
  today.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
) % QUOTES.length;
```

The result is saved in `localStorage` keyed by date to avoid recalculating on every popup open.

---

### Weather

Three steps, all free and keyless:

1. **Browser Geolocation API** asks the user for GPS coordinates (one-time permission prompt)
2. **Open-Meteo API** returns current temperature, WMO weather code, wind speed, and humidity
3. **Nominatim API** reverse-geocodes the coordinates into a human-readable city name

WMO weather codes are mapped locally to emoji + description (e.g. `0 → ☀️ Clear sky`).
Weather data is cached for **30 minutes** in `chrome.storage.local`.

---

### News

Uses the Hacker News public Firebase API — no authentication, no rate limits for normal use:

1. Fetch the top 500 story IDs from `hacker-news.firebaseio.com/v0/topstories.json`
2. Fetch full details for the first 8 IDs in parallel using `Promise.all`
3. Render each story as a clickable link with score and author

News is cached for **60 minutes** in `chrome.storage.local`.

---

### Cache System

A minimal TTL cache built on top of `chrome.storage.local`:

```js
// Stored structure per key:
{ data: <payload>, ts: <unix ms timestamp>, ttl: <minutes> }

// Cache is valid if:
(Date.now() - entry.ts) / 60000 < entry.ttl
```

---

## Permissions Explained

```json
"permissions": ["geolocation", "storage"]
```

| Permission | Why it's needed |
|------------|-----------------|
| `geolocation` | To get the user's coordinates for the weather feature |
| `storage` | To cache weather and news data between popup opens |

No other permissions are requested. The extension cannot read browsing history, access tabs, or communicate with any backend server.

---

## Installation

### Developer Mode (Local)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked**
4. Select the `daily-spark-english` folder
5. The Daily Spark icon appears in your toolbar — click it to open

### From Chrome Web Store *(coming soon)*

Search for **Daily Spark** on the Chrome Web Store and click **Add to Chrome**.

---

## Publishing to Chrome Web Store

To publish this extension publicly:

```bash
# 1. Zip the extension folder (exclude hidden files)
zip -r daily-spark-english.zip daily-spark-english/ --exclude "*.DS_Store" --exclude "*/.git/*"

# 2. Go to the Chrome Developer Dashboard
open https://chrome.google.com/webstore/devconsole

# 3. Pay the one-time $5 developer fee, upload the ZIP,
#    fill in the store listing, and submit for review.
#    Google typically approves within 1–3 business days.
```

---

## APIs Used

| API | Endpoint | Free Tier | Key Required |
|-----|----------|-----------|--------------|
| Open-Meteo | `api.open-meteo.com/v1/forecast` | Unlimited | ❌ No |
| Nominatim | `nominatim.openstreetmap.org/reverse` | Reasonable use | ❌ No |
| Hacker News | `hacker-news.firebaseio.com/v0` | Unlimited | ❌ No |

---

## Browser Support

| Browser | Supported |
|---------|-----------|
| Google Chrome | ✅ v88+ |
| Microsoft Edge | ✅ (Chromium-based) |
| Brave | ✅ |
| Firefox | ❌ (uses different extension API) |
| Safari | ❌ |

---

## License

MIT — free to use, modify, and distribute.
