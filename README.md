# SKIES — Weather App

A minimal, elegant weather app with a black/white/yellow design system.

## Features
- 🌤 Current weather conditions
- 📅 5-day forecast
- 🌡 °C / °F toggle
- 📍 Geolocation support
- 🕐 Local time display
- 💧 Humidity, wind, visibility, pressure, UV, dew point

## APIs Used (Free, No API Key Required)
- **[Open-Meteo](https://open-meteo.com/)** — Weather data & forecast
- **[Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api)** — City search
- **[Nominatim (OpenStreetMap)](https://nominatim.org/)** — Reverse geocoding for GPS location
- **[Basmilius Weather Icons](https://github.com/basmilius/weather-icons)** — Weather icons (CDN)

No API keys. No `.env` file needed. Just deploy.

---

## Deploy to Vercel (3 steps)

### Option A — Vercel CLI
```bash
npm i -g vercel
cd weather-app
vercel
```
Follow the prompts → your app goes live instantly.

### Option B — GitHub + Vercel Dashboard
1. Push this folder to a GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repo → click **Deploy**

That's it. No build step, no environment variables.

---

## Local Development
```bash
# Any static server works
npx serve .
# or
python3 -m http.server 3000
```
Open http://localhost:3000

## Project Structure
```
weather-app/
├── index.html     # Markup & layout
├── style.css      # All styles (CSS variables, responsive)
├── app.js         # Weather logic, API calls
├── vercel.json    # Vercel static deployment config
└── README.md
```
