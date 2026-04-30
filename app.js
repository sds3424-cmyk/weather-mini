/* =========================================
   SKIES WEATHER APP
   APIs used (both FREE, no key required):
   - Open-Meteo: weather data
   - Open-Meteo Geocoding: city search
   - Open-Meteo Air Quality: UV index
   ========================================= */

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

let useCelsius = true;
let lastWeatherData = null;

// WMO weather code → description + icon emoji
const WMO_CODES = {
  0: { text: 'Clear Sky', icon: '☀️' },
  1: { text: 'Mainly Clear', icon: '🌤️' },
  2: { text: 'Partly Cloudy', icon: '⛅' },
  3: { text: 'Overcast', icon: '☁️' },
  45: { text: 'Foggy', icon: '🌫️' },
  48: { text: 'Icy Fog', icon: '🌫️' },
  51: { text: 'Light Drizzle', icon: '🌦️' },
  53: { text: 'Drizzle', icon: '🌦️' },
  55: { text: 'Heavy Drizzle', icon: '🌧️' },
  61: { text: 'Light Rain', icon: '🌧️' },
  63: { text: 'Rain', icon: '🌧️' },
  65: { text: 'Heavy Rain', icon: '🌧️' },
  71: { text: 'Light Snow', icon: '🌨️' },
  73: { text: 'Snow', icon: '❄️' },
  75: { text: 'Heavy Snow', icon: '❄️' },
  80: { text: 'Rain Showers', icon: '🌦️' },
  81: { text: 'Rain Showers', icon: '🌧️' },
  82: { text: 'Heavy Showers', icon: '⛈️' },
  85: { text: 'Snow Showers', icon: '🌨️' },
  95: { text: 'Thunderstorm', icon: '⛈️' },
  96: { text: 'Thunderstorm', icon: '⛈️' },
  99: { text: 'Thunderstorm', icon: '⛈️' },
};

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const searchForm = $('searchForm');
const cityInput = $('cityInput');
const locationBtn = $('locationBtn');
const unitToggle = $('unitToggle');
const weatherDisplay = $('weatherDisplay');
const loader = $('loader');
const errorToast = $('errorToast');
let toastTimer;

// ===== UTILITIES =====
function showLoader() { loader.style.display = 'flex'; }
function hideLoader() { loader.style.display = 'none'; }

function showToast(msg) {
  clearTimeout(toastTimer);
  errorToast.textContent = msg;
  errorToast.classList.add('show');
  toastTimer = setTimeout(() => errorToast.classList.remove('show'), 3500);
}

function toF(c) { return Math.round(c * 9/5 + 32); }

function formatTemp(c) {
  const val = useCelsius ? Math.round(c) : toF(c);
  return `${val}°${useCelsius ? 'C' : 'F'}`;
}

function getWMO(code) {
  return WMO_CODES[code] || { text: 'Unknown', icon: '🌡️' };
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDayName(isoDate, short = false) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString([], { weekday: short ? 'short' : 'long' });
}

function getLocalTime(timezone) {
  return new Date().toLocaleTimeString([], {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  });
}

// ===== GEOCODING =====
async function geocode(city) {
  const url = `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error(`City "${city}" not found`);
  return data.results[0];
}

// ===== WEATHER FETCH =====
async function fetchWeather(lat, lon, timezone) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: timezone || 'auto',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'visibility',
      'surface_pressure',
      'dew_point_2m'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max'
    ].join(','),
    forecast_days: 6,
  });
  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}

// ===== RENDER =====
function renderWeather(geoData, weather) {
  lastWeatherData = { geoData, weather };
  const c = weather.current;
  const d = weather.daily;
  const tz = weather.timezone;

  // Location
  $('cityName').textContent = geoData.name;
  $('countryName').textContent = geoData.country || geoData.country_code || '';
  $('localTime').textContent = getLocalTime(tz);

  // Temperature
  $('tempDisplay').textContent = formatTemp(c.temperature_2m);
  $('feelsLike').textContent = formatTemp(c.apparent_temperature);

  // Condition
  const wmo = getWMO(c.weather_code);
  $('conditionText').textContent = wmo.text;
  $('weatherIcon').src = `https://raw.githubusercontent.com/basmilius/weather-icons/dev/production/line/all/${getIconSlug(c.weather_code)}.svg`;
  $('weatherIcon').alt = wmo.text;
  $('weatherIcon').onerror = function() { this.style.display='none'; };

  // Stats
  $('humidity').textContent = c.relative_humidity_2m + '%';
  $('humidityBar').style.width = c.relative_humidity_2m + '%';
  $('windSpeed').textContent = Math.round(c.wind_speed_10m);
  $('visibility').textContent = (c.visibility / 1000).toFixed(1);
  $('pressure').textContent = Math.round(c.surface_pressure);
  $('uvIndex').textContent = d.uv_index_max ? d.uv_index_max[0].toFixed(1) : '—';
  $('dewPoint').textContent = formatTemp(c.dew_point_2m);

  // Sun times
  $('sunrise').textContent = formatTime(d.sunrise[0]);
  $('sunset').textContent = formatTime(d.sunset[0]);

  // Forecast (skip today = index 0)
  const forecastRow = $('forecastRow');
  forecastRow.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    const fwmo = getWMO(d.weather_code[i]);
    const iconSrc = `https://raw.githubusercontent.com/basmilius/weather-icons/dev/production/line/all/${getIconSlug(d.weather_code[i])}.svg`;
    card.innerHTML = `
      <div class="forecast-day">${getDayName(d.time[i], true)}</div>
      <img class="forecast-icon" src="${iconSrc}" alt="${fwmo.text}" onerror="this.style.display='none'" />
      <div class="forecast-condition">${fwmo.text}</div>
      <div class="forecast-temps">
        <span class="forecast-high">${formatTemp(d.temperature_2m_max[i])}</span>
        <span class="forecast-low">${formatTemp(d.temperature_2m_min[i])}</span>
      </div>
    `;
    forecastRow.appendChild(card);
  }

  // Show section
  weatherDisplay.style.display = 'block';
  weatherDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Map WMO codes to icon slugs from the basmilius weather-icons set
function getIconSlug(code) {
  const map = {
    0: 'clear-day', 1: 'mostly-clear-day', 2: 'partly-cloudy-day',
    3: 'overcast', 45: 'fog', 48: 'fog',
    51: 'drizzle', 53: 'drizzle', 55: 'extreme-drizzle',
    61: 'rain', 63: 'rain', 65: 'extreme-rain',
    71: 'snow', 73: 'snow', 75: 'extreme-snow',
    80: 'rain', 81: 'rain', 82: 'extreme-rain',
    85: 'snow', 86: 'extreme-snow',
    95: 'thunderstorms', 96: 'thunderstorms-rain', 99: 'thunderstorms-extreme-rain',
  };
  return map[code] || 'not-available';
}

// ===== SEARCH HANDLER =====
async function handleSearch(city) {
  if (!city.trim()) { showToast('Please enter a city name'); return; }
  showLoader();
  try {
    const geo = await geocode(city);
    const weather = await fetchWeather(geo.latitude, geo.longitude, geo.timezone);
    renderWeather(geo, weather);
  } catch (err) {
    showToast(err.message || 'Something went wrong');
  } finally {
    hideLoader();
  }
}

// ===== GEOLOCATION =====
function handleGeolocation() {
  if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
  showLoader();
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        // Reverse geocode using Open-Meteo (no direct reverse, use lat/lon directly)
        const weather = await fetchWeather(lat, lon, 'auto');
        // Get city name from lat/lon via nominatim
        const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const revData = await rev.json();
        const city = revData.address?.city || revData.address?.town || revData.address?.village || 'Your Location';
        const country = revData.address?.country || '';
        renderWeather({ name: city, country, latitude: lat, longitude: lon }, weather);
      } catch (err) {
        showToast('Could not fetch location weather');
      } finally {
        hideLoader();
      }
    },
    () => { hideLoader(); showToast('Location permission denied'); }
  );
}

// ===== UNIT TOGGLE =====
unitToggle.addEventListener('click', () => {
  useCelsius = !useCelsius;
  unitToggle.textContent = useCelsius ? '°C / °F' : '°F / °C';
  if (lastWeatherData) renderWeather(lastWeatherData.geoData, lastWeatherData.weather);
});

// ===== EVENTS =====
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  handleSearch(cityInput.value);
});

locationBtn.addEventListener('click', handleGeolocation);

// Update local time every minute if weather is showing
setInterval(() => {
  if (lastWeatherData) {
    $('localTime').textContent = getLocalTime(lastWeatherData.weather.timezone);
  }
}, 60000);

// Default load: London as example
window.addEventListener('DOMContentLoaded', () => {
  handleSearch('London');
});
