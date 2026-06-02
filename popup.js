// ── Date ──────────────────────────────────────────────────────────────────────
document.getElementById("date").textContent = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

// ── Quote ─────────────────────────────────────────────────────────────────────
const q = getDailyQuote();
document.getElementById("quote-text").textContent = `"${q.text}"`;
document.getElementById("quote-author").textContent = q.author;

// ── Weather (Open-Meteo — no API key) ────────────────────────────────────────
const WMO_CODES = {
  0:  ["☀️", "Clear sky"],      1: ["🌤", "Mainly clear"],
  2:  ["⛅", "Partly cloudy"],  3: ["☁️", "Overcast"],
  45: ["🌫", "Foggy"],          48: ["🌫", "Icy fog"],
  51: ["🌦", "Light drizzle"],  53: ["🌦", "Drizzle"],       55: ["🌧", "Heavy drizzle"],
  61: ["🌧", "Light rain"],     63: ["🌧", "Rain"],           65: ["🌧", "Heavy rain"],
  71: ["🌨", "Light snow"],     73: ["🌨", "Snow"],           75: ["❄️", "Heavy snow"],
  80: ["🌦", "Rain showers"],   81: ["🌧", "Heavy showers"],  82: ["⛈", "Violent showers"],
  95: ["⛈", "Thunderstorm"],   96: ["⛈", "Thunderstorm + hail"],
};

async function loadWeather() {
  const el = document.getElementById("weather-body");
  const cached = await getCached("weather_en");
  if (cached) { renderWeather(el, cached); return; }

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const { latitude: lat, longitude: lon } = coords;

        const [geoRes, wRes] = await Promise.all([
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m` +
            `&wind_speed_unit=kmh&timezone=auto`
          )
        ]);

        const geo = await geoRes.json();
        const w   = await wRes.json();
        const c   = w.current;

        const data = {
          temp:     Math.round(c.temperature_2m),
          code:     c.weathercode,
          wind:     Math.round(c.windspeed_10m),
          humidity: c.relative_humidity_2m,
          city:     geo.address?.city || geo.address?.town || geo.address?.village || "",
        };

        await setCached("weather_en", data, 30);
        renderWeather(el, data);
      } catch {
        el.innerHTML = `<p class="weather-error">Failed to load weather.</p>`;
      }
    },
    () => {
      el.innerHTML = `
        <p class="weather-error">Location access denied.</p>
        <p class="weather-allow">Enable location permission to see weather.</p>`;
    }
  );
}

function renderWeather(el, d) {
  const [icon, desc] = WMO_CODES[d.code] ?? ["🌡", "Unknown"];
  el.innerHTML = `
    <div class="weather-main">
      <div class="weather-icon">${icon}</div>
      <div>
        <div class="weather-temp">${d.temp}<sup>°C</sup></div>
        <div class="weather-city">${desc}${d.city ? " · " + d.city : ""}</div>
      </div>
    </div>
    <div class="weather-details">
      <div class="weather-detail">💧 Humidity: <span>${d.humidity}%</span></div>
      <div class="weather-detail">💨 Wind: <span>${d.wind} km/h</span></div>
    </div>`;
}

// ── News (Hacker News — no API key) ──────────────────────────────────────────
async function loadNews() {
  const el = document.getElementById("news-list");
  const cached = await getCached("news_en");
  if (cached) { renderNews(el, cached); return; }

  try {
    const ids = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json").then(r => r.json());
    const stories = await Promise.all(
      ids.slice(0, 8).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
    );

    const data = stories.map(s => ({
      title: s.title,
      url:   s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      score: s.score,
      by:    s.by,
    }));

    await setCached("news_en", data, 60);
    renderNews(el, data);
  } catch {
    el.innerHTML = `<li style="font-size:12px;color:#f87171">Failed to load news.</li>`;
  }
}

function renderNews(el, stories) {
  el.innerHTML = stories.map(s => `
    <li class="news-item">
      <a href="${s.url}" target="_blank">${truncate(s.title, 72)}</a>
      <div class="news-meta">▲ ${s.score} · ${s.by}</div>
    </li>`).join("");
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
function getCached(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, res => {
      const entry = res[key];
      if (!entry) return resolve(null);
      resolve((Date.now() - entry.ts) / 60000 < entry.ttl ? entry.data : null);
    });
  });
}

function setCached(key, data, ttl) {
  return new Promise(resolve =>
    chrome.storage.local.set({ [key]: { data, ts: Date.now(), ttl } }, resolve)
  );
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadWeather();
loadNews();
