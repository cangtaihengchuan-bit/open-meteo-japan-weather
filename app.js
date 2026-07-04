const REQUEST_TIMEOUT_MS = 20000;

const locations = [
  { id: "tokyo", name: "\u6771\u4eac", latitude: 35.6762, longitude: 139.6503 },
  { id: "osaka", name: "\u5927\u962a", latitude: 34.6937, longitude: 135.5023 },
  { id: "fukuoka", name: "\u798f\u5ca1", latitude: 33.5902, longitude: 130.4017 },
  { id: "kagawa", name: "\u9999\u5ddd", latitude: 34.3401, longitude: 134.0434 },
];

const weatherLabels = new Map([
  [0, ["\u5feb\u6674", "\u2600"]],
  [1, ["\u6674\u308c", "\u2600"]],
  [2, ["\u4e00\u90e8\u66c7\u308a", "\u26c5"]],
  [3, ["\u66c7\u308a", "\u2601"]],
  [45, ["\u9727", "\ud83c\udf2b"]],
  [48, ["\u7740\u6c37\u6027\u306e\u9727", "\ud83c\udf2b"]],
  [51, ["\u5f31\u3044\u9727\u96e8", "\ud83c\udf26"]],
  [53, ["\u9727\u96e8", "\ud83c\udf26"]],
  [55, ["\u5f37\u3044\u9727\u96e8", "\ud83c\udf27"]],
  [61, ["\u5f31\u3044\u96e8", "\ud83c\udf27"]],
  [63, ["\u96e8", "\ud83c\udf27"]],
  [65, ["\u5f37\u3044\u96e8", "\ud83c\udf27"]],
  [66, ["\u5f31\u3044\u51cd\u96e8", "\ud83c\udf27"]],
  [67, ["\u5f37\u3044\u51cd\u96e8", "\ud83c\udf27"]],
  [71, ["\u5f31\u3044\u96ea", "\ud83c\udf28"]],
  [73, ["\u96ea", "\ud83c\udf28"]],
  [75, ["\u5f37\u3044\u96ea", "\ud83c\udf28"]],
  [77, ["\u96ea\u7c92", "\ud83c\udf28"]],
  [80, ["\u5f31\u3044\u306b\u308f\u304b\u96e8", "\ud83c\udf26"]],
  [81, ["\u306b\u308f\u304b\u96e8", "\ud83c\udf26"]],
  [82, ["\u5f37\u3044\u306b\u308f\u304b\u96e8", "\u26c8"]],
  [85, ["\u5f31\u3044\u306b\u308f\u304b\u96ea", "\ud83c\udf28"]],
  [86, ["\u5f37\u3044\u306b\u308f\u304b\u96ea", "\ud83c\udf28"]],
  [95, ["\u96f7\u96e8", "\u26c8"]],
  [96, ["\u3072\u3087\u3046\u3092\u4f34\u3046\u96f7\u96e8", "\u26c8"]],
  [99, ["\u5f37\u3044\u3072\u3087\u3046\u3092\u4f34\u3046\u96f7\u96e8", "\u26c8"]],
]);

const tabs = document.querySelector("#locationTabs");
const stage = document.querySelector("#weatherStage");
const statusText = document.querySelector("#statusText");
const refreshButton = document.querySelector("#refreshButton");
const tabTemplate = document.querySelector("#tabTemplate");
const weatherTemplate = document.querySelector("#weatherTemplate");

let weatherResults = [];
let selectedLocationId = locations[0].id;

refreshButton.addEventListener("click", loadWeather);

loadWeather();

async function loadWeather() {
  setLoading(true);
  tabs.replaceChildren();
  stage.replaceChildren(renderNotice("\u5929\u6c17\u60c5\u5831\u3092\u53d6\u5f97\u3057\u3066\u3044\u307e\u3059\u3002"));

  try {
    const startTime = performance.now();
    weatherResults = await fetchWeatherBatch();
    renderTabs();
    renderSelectedWeather();
    statusText.textContent = `${formatDateTime(new Date())} \u66f4\u65b0\u30fb${formatDuration(performance.now() - startTime)}`;
  } catch (error) {
    console.error(error);
    weatherResults = locations.map((location) => ({ location, data: null, error }));
    renderTabs();
    stage.replaceChildren(
      renderNotice("\u3059\u3079\u3066\u306e\u5730\u70b9\u3067\u5929\u6c17\u60c5\u5831\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002Open-Meteo\u3078\u306e\u63a5\u7d9a\u72b6\u614b\u3092\u78ba\u8a8d\u3057\u3001\u6642\u9593\u3092\u304a\u3044\u3066\u66f4\u65b0\u3057\u3066\u304f\u3060\u3055\u3044\u3002", true),
    );
    statusText.textContent = "\u53d6\u5f97\u5931\u6557";
  } finally {
    setLoading(false);
  }
}

async function fetchWeatherBatch() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const params = new URLSearchParams({
    latitude: locations.map((location) => location.latitude).join(","),
    longitude: locations.map((location) => location.longitude).join(","),
    timezone: "Asia/Tokyo",
    forecast_days: "1",
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed: ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : [payload];

    return locations.map((location, index) => ({
      location,
      data: items[index],
    }));
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderTabs() {
  const fragment = document.createDocumentFragment();

  weatherResults.forEach((result) => {
    const tab = tabTemplate.content.firstElementChild.cloneNode(true);
    const { location, data } = result;
    tab.id = `tab-${location.id}`;
    tab.setAttribute("aria-controls", "weatherStage");
    tab.setAttribute("aria-selected", String(location.id === selectedLocationId));
    tab.dataset.locationId = location.id;
    tab.querySelector(".tab-city").textContent = location.name;
    tab.querySelector(".tab-temp").textContent = data
      ? `${round(data.current.temperature_2m)}\u00b0C`
      : "\u53d6\u5f97\u5931\u6557";
    tab.addEventListener("click", () => {
      selectedLocationId = location.id;
      renderTabs();
      renderSelectedWeather();
    });
    fragment.append(tab);
  });

  tabs.replaceChildren(fragment);
}

function renderSelectedWeather() {
  const result = weatherResults.find((item) => item.location.id === selectedLocationId);
  if (!result) return;

  if (!result.data) {
    stage.replaceChildren(
      renderNotice(`${result.location.name}\u306e\u5929\u6c17\u60c5\u5831\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u66f4\u65b0\u30dc\u30bf\u30f3\u3067\u518d\u53d6\u5f97\u3067\u304d\u307e\u3059\u3002`, true),
    );
    return;
  }

  const card = weatherTemplate.content.firstElementChild.cloneNode(true);
  const { location, data } = result;
  const current = data.current;
  const daily = data.daily;
  const code = current.weather_code ?? daily.weather_code?.[0];
  const [label, icon] = weatherLabels.get(code) ?? ["\u4e0d\u660e", "\u2014"];

  card.querySelector(".city-name").textContent = location.name;
  card.querySelector(".observed-time").textContent = `${formatApiTime(current.time)} \u6642\u70b9`;
  card.querySelector(".weather-icon").textContent = icon;
  card.querySelector(".current-temp").textContent = `${round(current.temperature_2m)}\u00b0C`;
  card.querySelector(".weather-label").textContent = label;
  card.querySelector(".temp-range").textContent =
    `${round(daily.temperature_2m_max?.[0])}\u00b0 / ${round(daily.temperature_2m_min?.[0])}\u00b0`;
  card.querySelector(".rain-probability").textContent =
    `${daily.precipitation_probability_max?.[0] ?? "--"}%`;
  card.querySelector(".precipitation").textContent = `${round(daily.precipitation_sum?.[0])} mm`;
  card.querySelector(".wind").textContent =
    `${round(current.wind_speed_10m)} km/h / ${current.relative_humidity_2m ?? "--"}%`;

  stage.replaceChildren(card);
}

function renderNotice(text, isError = false) {
  const notice = document.createElement("p");
  notice.className = isError ? "notice error" : "notice";
  notice.textContent = text;
  return notice;
}

function setLoading(isLoading) {
  refreshButton.disabled = isLoading;
  if (isLoading) statusText.textContent = "\u8aad\u307f\u8fbc\u307f\u4e2d";
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value) : "--";
}

function formatApiTime(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(milliseconds) {
  return `${(milliseconds / 1000).toFixed(1)}\u79d2`;
}
