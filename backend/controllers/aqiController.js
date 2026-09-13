// controllers/aqiController.js — AQI & Weather Intelligence
const axios  = require('axios');
const { asyncHandler, createError } = require('../middleware');
const { sendAQIAlert } = require('../services/notificationService');

/* ─── AQI Category Mapping ─── */
function getAQICategory(aqi) {
  if (aqi <= 50)  return { category: 'Good',          color: '#22c55e', risk: 'low',      emoji: '😊' };
  if (aqi <= 100) return { category: 'Moderate',       color: '#eab308', risk: 'moderate', emoji: '😐' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', color: '#f97316', risk: 'elevated', emoji: '😷' };
  if (aqi <= 200) return { category: 'Unhealthy',      color: '#ef4444', risk: 'high',     emoji: '⚠️' };
  if (aqi <= 300) return { category: 'Very Unhealthy', color: '#a855f7', risk: 'very-high',emoji: '🚫' };
  return { category: 'Hazardous', color: '#7f1d1d', risk: 'hazardous', emoji: '☠️' };
}

/* ─── Elderly-specific Recommendations ─── */
function getRecommendations(aqi, temp, humidity, conditions) {
  const recs    = [];
  const outdoor = [];
  const { risk } = getAQICategory(aqi);

  if (risk === 'low') {
    recs.push('🌿 Air quality is excellent! Great day for outdoor activities.');
    outdoor.push('✅ Safe to take a walk outside', '✅ Open windows for fresh air', '🌞 Enjoy some sunlight');
  } else if (risk === 'moderate') {
    recs.push('😐 Air quality is acceptable. Unusually sensitive individuals may experience discomfort.');
    outdoor.push('⚠️ Limit prolonged outdoor activity', '😷 Consider a mask if sensitive');
  } else if (risk === 'elevated') {
    recs.push('😷 Air quality is unhealthy for sensitive groups including elderly and those with respiratory conditions.');
    recs.push('🏠 Elderly individuals should limit outdoor activity.');
    outdoor.push('🚫 Avoid prolonged outdoor exertion', '😷 Wear N95 mask if going out', '🪟 Keep windows closed');
  } else {
    recs.push('🚫 DANGEROUS air quality! Elderly persons should remain indoors.');
    recs.push('🏠 Stay indoors with windows and doors closed. Use air purifier if available.');
    outdoor.push('🚫 Do NOT go outside', '🏠 Stay indoors at all times', '🌬️ Use air purifier');
  }

  // Temperature recommendations
  if (temp !== undefined) {
    if (temp > 35) { recs.push('🌡️ Extreme heat — stay hydrated, avoid peak afternoon hours (11am–4pm).'); }
    else if (temp > 28) { recs.push('☀️ Warm weather — drink plenty of water and wear light clothing.'); }
    else if (temp < 10) { recs.push('🧥 Cold weather — dress in layers, protect joints and chest.'); }
  }

  // Humidity recommendations
  if (humidity !== undefined) {
    if (humidity > 80) recs.push('💧 High humidity may cause discomfort for respiratory conditions. Use dehumidifier.');
    if (humidity < 30) recs.push('🏜️ Low humidity — use humidifier to protect respiratory tract.');
  }

  return { recommendations: recs, outdoorAdvice: outdoor };
}

/* ─── Fetch AQI using Open-Meteo (Free, No Key) + WAQI API ─── */
exports.getAQI = asyncHandler(async (req, res) => {
  const { lat, lng, city } = req.query;

  if (!lat || !lng) {
    throw createError('Latitude and longitude are required. Send ?lat=X&lng=Y', 400);
  }

  let aqiData = null;
  let weatherData = null;

  /* ── Fetch AQI from Open-Meteo Air Quality API (Free, no key) ── */
  try {
    const aqiRes = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
      params: {
        latitude:  lat,
        longitude: lng,
        current:   'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone',
        timezone:  'auto',
      },
      timeout: 10000,
    });

    const current = aqiRes.data?.current;
    const aqi     = current?.us_aqi ?? 0;
    const info    = getAQICategory(aqi);

    aqiData = {
      aqi,
      pm25:             current?.pm2_5,
      pm10:             current?.pm10,
      co:               current?.carbon_monoxide,
      no2:              current?.nitrogen_dioxide,
      ozone:            current?.ozone,
      ...info,
      source: 'Open-Meteo',
    };
  } catch (e) {
    console.error('AQI API error:', e.message);
    // Fallback mock data
    aqiData = { aqi: 42, category: 'Good', color: '#22c55e', risk: 'low', emoji: '😊', source: 'mock' };
  }

  /* ── Fetch Weather from Open-Meteo (Free, no key) ── */
  try {
    const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude:  lat,
        longitude: lng,
        current:   'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation',
        timezone:  'auto',
      },
      timeout: 10000,
    });

    const w = weatherRes.data?.current;
    const code = w?.weather_code;
    const weatherDesc = getWeatherDescription(code);

    weatherData = {
      temperature:       Math.round(w?.temperature_2m ?? 20),
      feelsLike:         Math.round(w?.apparent_temperature ?? 20),
      humidity:          w?.relative_humidity_2m,
      windSpeed:         w?.wind_speed_10m,
      precipitation:     w?.precipitation,
      description:       weatherDesc.label,
      icon:              weatherDesc.emoji,
      isGoodForWalk:     aqiData.risk === 'low' && (w?.temperature_2m ?? 20) < 33 && (w?.temperature_2m ?? 20) > 10 && (w?.wind_speed_10m ?? 0) < 30,
    };
  } catch (e) {
    console.error('Weather API error:', e.message);
    weatherData = { temperature: 22, humidity: 55, description: 'Partly cloudy', icon: '⛅', isGoodForWalk: true };
  }

  /* ── Generate Recommendations ── */
  const { recommendations, outdoorAdvice } = getRecommendations(
    aqiData.aqi, weatherData.temperature, weatherData.humidity, weatherData.description
  );

  const response = {
    success: true,
    location: { lat: parseFloat(lat), lng: parseFloat(lng), city: city || 'Your Location' },
    aqi: { ...aqiData, recommendations, outdoorAdvice },
    weather: weatherData,
    isGoodForOutdoor: weatherData.isGoodForWalk && aqiData.risk === 'low',
    alertLevel: aqiData.risk,
    lastUpdated: new Date(),
  };

  res.json(response);
});

/* ─── Send AQI Email Alert ─── */
exports.sendAQIEmailAlert = asyncHandler(async (req, res) => {
  const { aqiData } = req.body;
  if (!aqiData) throw createError('AQI data required');

  const result = await sendAQIAlert(req.user, aqiData);
  res.json({ success: true, message: 'AQI alert email sent.', result });
});

/* ─── Weather Code → Description ─── */
function getWeatherDescription(code) {
  const map = {
    0:  { label: 'Clear sky',           emoji: '☀️'  },
    1:  { label: 'Mainly clear',        emoji: '🌤️' },
    2:  { label: 'Partly cloudy',       emoji: '⛅'  },
    3:  { label: 'Overcast',            emoji: '☁️'  },
    45: { label: 'Foggy',               emoji: '🌫️' },
    48: { label: 'Icy fog',             emoji: '🌫️' },
    51: { label: 'Light drizzle',       emoji: '🌦️' },
    61: { label: 'Slight rain',         emoji: '🌧️' },
    63: { label: 'Moderate rain',       emoji: '🌧️' },
    65: { label: 'Heavy rain',          emoji: '⛈️'  },
    71: { label: 'Slight snow',         emoji: '🌨️' },
    80: { label: 'Rain showers',        emoji: '🌦️' },
    95: { label: 'Thunderstorm',        emoji: '⛈️'  },
  };
  return map[code] || { label: 'Variable', emoji: '🌡️' };
}
