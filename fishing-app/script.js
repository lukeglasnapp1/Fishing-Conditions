const searchForm = document.querySelector("#search-form");
const locationInput = document.querySelector("#location-input");
const statusMessage = document.querySelector("#status");
const resultsSection = document.querySelector("#results-section");
const resultsTitle = document.querySelector("#results-title");
const fishingSummary = document.querySelector("#fishing-summary");
const weatherCards = document.querySelector("#weather-cards");
const forecast = document.querySelector("#forecast");
const saveButton = document.querySelector("#save-location");
const savedLocationsContainer = document.querySelector("#saved-locations");

let currentLocation = null;

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const location = locationInput.value.trim();

  if (!location) {
    showStatus("Please enter a location.", "error");
    return;
  }

  await searchLocation(location);
});

saveButton.addEventListener("click", () => {
  if (!currentLocation) return;

  const saved = getSavedLocations();
  const alreadySaved = saved.some(
    (location) => location.id === currentLocation.id
  );

  if (!alreadySaved) {
    saved.push(currentLocation);
    localStorage.setItem("fishingLocations", JSON.stringify(saved));
    renderSavedLocations();
  }

  updateSaveButton();
});

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`;
}

async function searchLocation(locationName) {
  showStatus("Loading fishing conditions...", "loading");
  resultsSection.hidden = true;

  try {
    const geocodeResponse = await fetch(
      `${GEOCODING_URL}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
    );

    if (!geocodeResponse.ok) {
      throw new Error("Unable to search for that location.");
    }

    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error("Location not found. Try a city name such as Corpus Christi.");
    }

    const place = geocodeData.results[0];

    const weatherResponse = await fetch(
      `${WEATHER_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`
    );

    if (!weatherResponse.ok) {
      throw new Error("Unable to load weather data.");
    }

    const weatherData = await weatherResponse.json();

    currentLocation = {
      id: `${place.latitude},${place.longitude}`,
      name: place.name,
      admin1: place.admin1 || "",
      country: place.country || "",
      latitude: place.latitude,
      longitude: place.longitude
    };

    renderWeather(place, weatherData);
    showStatus("");
  } catch (error) {
    showStatus(error.message || "Something went wrong. Please try again.", "error");
  }
}

function renderWeather(place, weather) {
  const current = weather.current;

  resultsTitle.textContent = `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}`;

  const fishingScore = calculateFishingScore(current);
  const ratingClass =
    fishingScore >= 75 ? "rating-good" :
    fishingScore >= 50 ? "rating-fair" :
    "rating-poor";

  fishingSummary.innerHTML = `
    <div class="rating ${ratingClass}">
      Fishing Rating: ${fishingScore}/100
    </div>
    <p>${getFishingMessage(fishingScore, current)}</p>
  `;

  weatherCards.innerHTML = `
    ${weatherCard("🌡️", "Temperature", `${Math.round(current.temperature_2m)}°F`)}
    ${weatherCard("💨", "Wind", `${Math.round(current.wind_speed_10m)} mph`)}
    ${weatherCard("🧭", "Wind Direction", `${degreesToDirection(current.wind_direction_10m)}`)}
    ${weatherCard("🌧️", "Precipitation", `${current.precipitation} mm`)}
  `;

  forecast.innerHTML = weather.daily.time.map((date, index) => `
    <article class="forecast-card">
      <h4>${formatDate(date)}</h4>
      <p>${weatherDescription(weather.daily.weather_code[index])}</p>
      <p><strong>${Math.round(weather.daily.temperature_2m_max[index])}°</strong> / ${Math.round(weather.daily.temperature_2m_min[index])}°F</p>
      <p>Rain chance: ${weather.daily.precipitation_probability_max[index]}%</p>
    </article>
  `).join("");

  resultsSection.hidden = false;
  updateSaveButton();
}

function weatherCard(icon, label, value) {
  return `
    <article class="weather-card">
      <div class="icon" aria-hidden="true">${icon}</div>
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </article>
  `;
}

function calculateFishingScore(current) {
  let score = 100;

  const wind = current.wind_speed_10m;
  const precipitation = current.precipitation;
  const temperature = current.temperature_2m;

  if (wind > 20) score -= 35;
  else if (wind > 15) score -= 20;
  else if (wind > 10) score -= 10;

  if (precipitation > 5) score -= 25;
  else if (precipitation > 1) score -= 10;

  if (temperature < 45 || temperature > 95) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function getFishingMessage(score, current) {
  if (score >= 75) {
    return "Conditions look favorable for a fishing trip. Keep an eye on changing wind and weather.";
  }

  if (score >= 50) {
    return "Conditions are fair. Fishing may still be worthwhile, but consider the wind and weather before heading out.";
  }

  return "Conditions may be challenging. Consider waiting for calmer or more comfortable weather.";
}

function degreesToDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}

function weatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail"
  };

  return descriptions[code] || "Unknown conditions";
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function getSavedLocations() {
  try {
    return JSON.parse(localStorage.getItem("fishingLocations")) || [];
  } catch {
    return [];
  }
}

function renderSavedLocations() {
  const saved = getSavedLocations();

  if (saved.length === 0) {
    savedLocationsContainer.innerHTML =
      '<p class="empty-message">No saved locations yet.</p>';
    return;
  }

  savedLocationsContainer.innerHTML = saved.map((location) => `
    <article class="saved-item">
      <strong>${escapeHtml(location.name)}${location.admin1 ? `, ${escapeHtml(location.admin1)}` : ""}</strong>
      <div>
        <button class="load-button" type="button" data-id="${location.id}">Check</button>
        <button class="delete-button" type="button" data-id="${location.id}" aria-label="Remove ${escapeHtml(location.name)}">Remove</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".load-button").forEach((button) => {
    button.addEventListener("click", () => {
      const location = saved.find((item) => item.id === button.dataset.id);
      if (location) {
        locationInput.value = location.name;
        searchLocation(location.name);
      }
    });
  });

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      const remaining = saved.filter((item) => item.id !== button.dataset.id);
      localStorage.setItem("fishingLocations", JSON.stringify(remaining));
      renderSavedLocations();
      updateSaveButton();
    });
  });
}

function updateSaveButton() {
  if (!currentLocation) {
    saveButton.textContent = "☆ Save Location";
    return;
  }

  const saved = getSavedLocations();
  const isSaved = saved.some((location) => location.id === currentLocation.id);

  saveButton.textContent = isSaved ? "★ Saved" : "☆ Save Location";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

renderSavedLocations();
