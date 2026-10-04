# Fishing Conditions

A responsive vanilla HTML/CSS/JavaScript web app that helps anglers check weather conditions before going fishing.

## Features

- Search for a location
- Asynchronously retrieve location data
- Retrieve current weather conditions
- Display temperature, wind, wind direction, and precipitation
- Display a 3-day forecast
- Calculate a simple fishing conditions rating
- Save and remove favorite locations with `localStorage`
- Loading and error states
- Responsive layout using CSS Grid and Flexbox
- Semantic HTML and accessible form labels

## How to Run

No framework, package manager, or API key is required.

1. Download or clone this repository.
2. Open the project folder.
3. Run `index.html` using a local development server such as VS Code Live Server.
4. Search for a city such as `Corpus Christi`.

Because the application uses browser `fetch()` requests, using a local development server is recommended instead of opening the HTML file directly with `file://`.

## Data Source

This project uses the following Open-Meteo services:

- Open-Meteo Geocoding API: https://geocoding-api.open-meteo.com/
- Open-Meteo Weather Forecast API: https://api.open-meteo.com/

Open-Meteo provides weather forecast data without requiring an API key for the project's intended use.

Location data is provided through Open-Meteo's geocoding service, which is based on GeoNames.

## AI Assistance Disclosure

AI tools were used during development to assist with project planning, explaining concepts, generating initial code, debugging, and reviewing the implementation. The student reviewed, tested, and modified the code and is responsible for the final project.

## Technologies

- HTML5
- CSS3
- JavaScript
- Fetch API
- Open-Meteo API
- Browser localStorage
