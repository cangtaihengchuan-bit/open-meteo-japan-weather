const locations = [
  { name: "東京", latitude: 35.6762, longitude: 139.6503 },
  { name: "大阪", latitude: 34.6937, longitude: 135.5023 },
  { name: "福岡", latitude: 33.5902, longitude: 130.4017 },
  { name: "香川", latitude: 34.3401, longitude: 134.0434 },
];

const weatherLabels = new Map([
  [0, ["快晴", "☀"]],
  [1, ["晴れ", "🌤"]],
  [2, ["一部曇り", "⛅"]],
  [3, ["曇り", "☁"]],
  [45, ["霧", "🌫"]],
  [48, ["着氷性の霧", "🌫"]],
  [51, ["弱い霧雨", "🌦"]],
  [53, ["霧雨", "🌦"]],
  [55, ["強い霧雨", "🌧"]],
  [61, ["弱い雨", "🌧"]],
  [63, ["雨", "🌧"]],
  [65, ["強い雨", "🌧"]],
  [66, ["弱い凍雨", "🌧"]],
  [67, ["強い凍雨", "🌧"]],
  [71, ["弱い雪", "🌨"]],
  [73, ["雪", "🌨"]],
  [75, ["強い雪", "🌨"]],
  [77, ["雪粒", "🌨"]],
  [80, ["弱いにわか雨", "🌦"]],
  [81, ["にわか雨", "🌦"]],
  [82, ["強いにわか雨", "⛈"]],
  [85, ["弱いにわか雪", "🌨"]],
  [86, ["強いにわか雪", "🌨"]],
  [95, ["雷雨", "⛈"]],
  [96, ["ひょうを伴う雷雨", "⛈"]],
  [99, ["強いひょうを伴う雷雨", "⛈"]],
]);

const grid = document.querySelector("#weatherGrid");
const statusText = document.querySelector("#statusText");
const refreshButton = document.querySelector("#refreshButton");
const template = document.querySelector("#weatherCardTemplate");

refreshButton.addEventListener("click", loadWeather);

loadWeather();

async function loadWeather() {
  setLoading(true);
  grid.replaceChildren();

  try {
    const results = await Promise.all(locations.map(fetchWeather));
    results.forEach(renderWeatherCard);
    statusText.textContent = `${formatDateTime(new Date())} 更新`;
  } catch (error) {
    console.error(error);
    const message = document.createElement("p");
    message.className = "error";
    message.textContent = "天気情報を取得できませんでした。ネットワーク接続を確認して、もう一度お試しください。";
    grid.append(message);
    statusText.textContent = "取得失敗";
  } finally {
    setLoading(false);
  }
}

async function fetchWeather(location) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: "Asia/Tokyo",
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

    return {
      location,
      data: await response.json(),
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderWeatherCard({ location, data }) {
  const card = template.content.firstElementChild.cloneNode(true);
  const current = data.current;
  const daily = data.daily;
  const code = current.weather_code ?? daily.weather_code?.[0];
  const [label, icon] = weatherLabels.get(code) ?? ["不明", "—"];

  card.querySelector(".city-name").textContent = location.name;
  card.querySelector(".observed-time").textContent = `${formatApiTime(current.time)} 時点`;
  card.querySelector(".weather-icon").textContent = icon;
  card.querySelector(".current-temp").textContent = `${round(current.temperature_2m)}°C`;
  card.querySelector(".weather-label").textContent = label;
  card.querySelector(".temp-range").textContent =
    `${round(daily.temperature_2m_max?.[0])}° / ${round(daily.temperature_2m_min?.[0])}°`;
  card.querySelector(".rain-probability").textContent =
    `${daily.precipitation_probability_max?.[0] ?? "--"}%`;
  card.querySelector(".precipitation").textContent = `${round(daily.precipitation_sum?.[0])} mm`;
  card.querySelector(".wind").textContent =
    `${round(current.wind_speed_10m)} km/h・湿度 ${current.relative_humidity_2m ?? "--"}%`;

  grid.append(card);
}

function setLoading(isLoading) {
  refreshButton.disabled = isLoading;
  statusText.textContent = isLoading ? "読み込み中" : statusText.textContent;
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
