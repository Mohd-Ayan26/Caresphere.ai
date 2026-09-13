// src/pages/modules/AQIModule.jsx — Clean Enterprise AQI Telemetry
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wind, Thermometer, Droplets, AlertTriangle, CheckCircle, RefreshCw, MapPin, Mail, Cloud } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AQIModule({ compact = false }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [sending, setSending] = useState(false);

  const fetchAQI = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const { data: res } = await api.get(`/aqi?lat=${lat}&lng=${lng}`);
      setData(res);
    } catch (e) {
      try {
        const { data: res } = await api.get('/aqi?lat=40.7128&lng=-74.0060&city=New%20York');
        setData(res);
      } catch { setError('Could not fetch air telemetry data.'); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAQI(); }, [fetchAQI]);

  const sendAlert = async () => {
    if (!data) return;
    setSending(true);
    try {
      await api.post('/aqi/send-alert', { aqiData: { ...data.aqi, city: data.location?.city } });
      toast.success('AQI telemetry alert emailed');
    } catch { toast.error('Failed to send alert.'); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-xs">
      <p className="text-xs text-slate-400">Loading atmospheric telemetry...</p>
    </div>
  );

  if (error || !data) return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center shadow-xs">
      <p className="text-xs text-slate-400 mb-2">{error || 'Location access required for local AQI.'}</p>
      <button onClick={fetchAQI} className="btn-secondary mx-auto">
        <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
      </button>
    </div>
  );

  const { aqi: aqiData, weather, location, isGoodForOutdoor } = data;

  if (compact) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Air Quality Telemetry</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{aqiData.category}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">{aqiData.aqi}</p>
            <p className="text-[10px] text-slate-400 uppercase">AQI Index</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
          {isGoodForOutdoor ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          {isGoodForOutdoor ? 'Favorable for outdoor activity' : 'Outdoor activity advisory in effect'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wind className="w-5 h-5 text-blue-600" /> Atmospheric & AQI Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Environmental air quality index, pollutant concentrations & health advisories</p>
        </div>
        <button onClick={fetchAQI} className="btn-secondary">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AQI Status</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{aqiData.category}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {location?.city}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-blue-600">{aqiData.aqi}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold">AQI Index</p>
          </div>
        </div>

        {weather && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-[11px] text-slate-400">Temperature</p><p className="font-bold text-slate-900 dark:text-white">{weather.temperature}°C</p></div>
            <div><p className="text-[11px] text-slate-400">Humidity</p><p className="font-bold text-slate-900 dark:text-white">{weather.humidity}%</p></div>
            <div><p className="text-[11px] text-slate-400">Wind Speed</p><p className="font-bold text-slate-900 dark:text-white">{weather.windSpeed} km/h</p></div>
            <div><p className="text-[11px] text-slate-400">Condition</p><p className="font-bold text-slate-900 dark:text-white">{weather.description}</p></div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Health Recommendations</h3>
        {(aqiData.recommendations || []).map((rec, i) => (
          <p key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> {rec}
          </p>
        ))}
      </div>

      <button onClick={sendAlert} disabled={sending} className="btn-secondary w-full">
        <Mail className="w-3.5 h-3.5" /> Dispatch Telemetry Email Alert
      </button>
    </div>
  );
}
