const defaults = {
  green: 80,
  yellow: 60,
  windWeight: 50,
  rainWeight: 30,
  humidityWeight: 20
};

const settings = Object.assign({}, defaults, JSON.parse(localStorage.getItem("ruiskutuskeliSettings") || "{}"));
const els = {
  settingsBtn: document.getElementById("settingsBtn"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  saveBtn: document.getElementById("saveBtn"),
  forecast: document.getElementById("forecast"),
  bestWindow: document.getElementById("bestWindow"),
  selectedPoint: document.getElementById("selectedPoint")
};

for (const key of Object.keys(defaults)) {
  const input = document.getElementById(key);
  if (input) input.value = settings[key];
}

els.settingsBtn.addEventListener("click", () => els.settingsModal.classList.remove("hidden"));
els.closeSettingsBtn.addEventListener("click", () => els.settingsModal.classList.add("hidden"));
els.settingsModal.addEventListener("click", (event) => {
  if (event.target === els.settingsModal) els.settingsModal.classList.add("hidden");
});
els.saveBtn.addEventListener("click", () => {
  for (const key of Object.keys(defaults)) {
    settings[key] = Number(document.getElementById(key).value);
  }
  localStorage.setItem("ruiskutuskeliSettings", JSON.stringify(settings));
  els.settingsModal.classList.add("hidden");
});

const map = L.map("map", { tap: true }).setView([63.095, 21.616], 9);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

let marker = null;

function formatTime(value) {
  const date = new Date(value);
  return date.toLocaleString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(",", "");
}

function scoreHour(wind, rainProbability, humidity) {
  let score = 0;
  score += wind <= 4 ? settings.windWeight : wind <= 6 ? settings.windWeight * 0.6 : wind <= 8 ? settings.windWeight * 0.2 : 0;
  score += rainProbability <= 10 ? settings.rainWeight : rainProbability <= 30 ? settings.rainWeight * 0.5 : 0;
  score += humidity >= 50 && humidity <= 90 ? settings.humidityWeight : humidity >= 40 && humidity <= 95 ? settings.humidityWeight * 0.5 : 0;
  return Math.round(score);
}

function rowClass(score) {
  if (score >= settings.green) return "good";
  if (score >= settings.yellow) return "ok";
  return "bad";
}

async function fetchForecast(lat, lon) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("hourly", "wind_speed_10m,relative_humidity_2m,precipitation_probability");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("wind_speed_unit", "ms");
  url.searchParams.set("timezone", "auto");
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Sääennusteen haku epäonnistui");
  return response.json();
}

function renderForecast(hourly) {
  els.forecast.innerHTML = "";
  let bestStart = null;
  let bestLength = 0;
  let currentStart = null;
  let currentLength = 0;

  for (let i = 0; i < hourly.time.length; i++) {
    const wind = Number(hourly.wind_speed_10m[i]);
    const rain = Number(hourly.precipitation_probability[i]);
    const humidity = Number(hourly.relative_humidity_2m[i]);
    const score = scoreHour(wind, rain, humidity);
    const cls = rowClass(score);

    els.forecast.insertAdjacentHTML("beforeend", `
      <tr class="${cls}">
        <td>${formatTime(hourly.time[i])}</td>
        <td>${wind.toFixed(1)}</td>
        <td>${rain}</td>
        <td>${humidity}</td>
        <td>${score}</td>
      </tr>
    `);

    if (score >= settings.green) {
      if (currentStart === null) currentStart = i;
      currentLength += 1;
      if (currentLength > bestLength) {
        bestLength = currentLength;
        bestStart = currentStart;
      }
    } else {
      currentStart = null;
      currentLength = 0;
    }
  }

  if (bestLength > 0) {
    els.bestWindow.textContent = `✅ Paras ruiskutusikkuna alkaa ${formatTime(hourly.time[bestStart])} ja kestää noin ${bestLength} h`;
  } else {
    els.bestWindow.textContent = "❌ Ei vihreää ruiskutusikkunaa seuraavan 72 h aikana";
  }
}

async function selectPoint(latlng) {
  if (marker) map.removeLayer(marker);
  marker = L.marker([latlng.lat, latlng.lng]).addTo(map);
  els.selectedPoint.textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
  els.bestWindow.textContent = "Haetaan ennustetta...";
  els.forecast.innerHTML = `<tr><td colspan="5" class="empty">Haetaan 72 h ennustetta...</td></tr>`;

  try {
    const data = await fetchForecast(latlng.lat, latlng.lng);
    renderForecast(data.hourly);
  } catch (error) {
    els.bestWindow.textContent = "Ennusteen haku epäonnistui";
    els.forecast.innerHTML = `<tr><td colspan="5" class="empty">${error.message}</td></tr>`;
  }
}

map.on("click", (event) => selectPoint(event.latlng));
map.on("tap", (event) => selectPoint(event.latlng));

setTimeout(() => map.invalidateSize(), 250);
