# Open-Meteo Japan Weather

A small static web app that shows today's weather for selected locations in Japan using the Open-Meteo Forecast API.

## Locations

- Tokyo
- Osaka
- Fukuoka
- Kagawa

## Features

- Location tabs for switching between cities and prefectures
- Batched Open-Meteo request for all locations
- One-day forecast data to keep the response small
- Displayed load duration after each successful update
- Current weather and temperature
- Daily high and low temperature
- Precipitation probability and precipitation amount
- Wind speed and humidity

## Local Preview

Open `index.html` in a browser, or serve the folder with any static file server.

```powershell
npx serve .
```
