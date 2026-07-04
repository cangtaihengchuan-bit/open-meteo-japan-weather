# Open-Meteo Japan Weather

A small static web app that shows today's weather for selected locations in Japan using the Open-Meteo Forecast API.

## Locations

- Tokyo
- Osaka
- Fukuoka
- Kagawa

## Features

- Location tabs for switching between cities and prefectures
- A longer request timeout of up to 180 seconds for slow Open-Meteo responses
- Partial results when some locations fail but others succeed
- Current weather and temperature
- Daily high and low temperature
- Precipitation probability and precipitation amount
- Wind speed and humidity

## Local Preview

Open `index.html` in a browser, or serve the folder with any static file server.

```powershell
npx serve .
```
