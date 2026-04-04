/**
 * useSensors Hook - KavachForWork
 * Collects location integrity + hardware heartbeat for fraud detection.
 */
import { useState, useCallback } from 'react';

const isNative = () => typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();

export function useSensors() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const collectSensorData = useCallback(async ({ requireLiveLocation = false } = {}) => {
    setLoading(true);
    setError(null);

    try {
      let location = null;
      let networkType = 'mobile';
      let networkTypeEncoded = 2;
      let nativeMetrics = {};
      let locationIntegrity = {};
      let heartbeat = {};

      try {
        if (isNative()) {
          const { Geolocation } = await import('@capacitor/geolocation');
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });
          location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
          };
        } else {
          location = await new Promise((resolve, reject) => {
            navigator.geolocation?.getCurrentPosition(
              (pos) => resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              }),
              (err) => reject(err),
              { enableHighAccuracy: true, timeout: 8000 }
            );
          });
        }
      } catch (geoErr) {
        if (requireLiveLocation) {
          throw new Error(geoErr.message || 'Live location is required for verification.');
        }

        console.warn('[Sensors] Geolocation failed, using Jaipur demo:', geoErr.message);
        location = { lat: 26.9124, lng: 75.7873, accuracy: 50 };
      }

      if (isNative()) {
        try {
          const { Capacitor } = await import('@capacitor/core');
          const plugin = Capacitor.Plugins.KavachPlugin;
          nativeMetrics = await plugin.getDeviceMetrics();
          locationIntegrity = await plugin.getLocationIntegrity();
          heartbeat = await plugin.getSensorFusionHeartbeat();
        } catch (nativeErr) {
          console.warn('[Sensors] Native plugin metrics unavailable:', nativeErr.message);
        }
      }

      let deviceTemp = nativeMetrics.deviceTemp;
      let isCharging = nativeMetrics.isCharging || false;
      let batteryLevel = nativeMetrics.batteryLevel ?? 0.6;
      let batteryDrainRate = nativeMetrics.drainRate ?? 0.3;
      let brightnessLevel = nativeMetrics.brightness ?? nativeMetrics.screenBrightness ?? 0.8;

      if (!isNative()) {
        try {
          if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            isCharging = battery.charging;
            batteryLevel = battery.level;
            batteryDrainRate = isCharging ? 0.05 : 0.35;
          }
        } catch {
          isCharging = false;
          batteryDrainRate = 0.3;
        }
        deviceTemp = 40 + Math.random() * 4;
      }

      try {
        if (navigator.connection) {
          const conn = navigator.connection;
          const type = conn.type || conn.effectiveType;
          if (type === 'wifi') {
            networkType = 'wifi';
            networkTypeEncoded = 0;
          } else if (type && type !== 'unknown') {
            networkType = 'mobile';
            networkTypeEncoded = 2;
          } else {
            networkType = 'unknown';
            networkTypeEncoded = 1;
          }
        }
      } catch {
        networkType = 'mobile';
        networkTypeEncoded = 2;
      }

      const jitter = location.accuracy
        ? Math.min(5, (100 / location.accuracy) * 0.5)
        : 0.5;

      const data = {
        location,
        deviceTemp: parseFloat((deviceTemp || 40).toFixed(1)),
        isCharging,
        batteryLevel,
        batteryDrainRate: parseFloat((batteryDrainRate || 0.3).toFixed(3)),
        networkType,
        networkTypeEncoded,
        brightnessLevel: parseFloat((brightnessLevel || 0.8).toFixed(2)),
        jitter: parseFloat(jitter.toFixed(3)),
        altitudeVariance: parseFloat((Math.random() * 0.5 || 0.15).toFixed(3)),
        isMockLocation: !!locationIntegrity.isMockLocation,
        locationVerified: locationIntegrity.locationVerified !== false,
        hardwareHeartbeat: !!heartbeat.hardwareHeartbeat,
        batteryTempStatic: !!heartbeat.batteryTempStatic,
        motionIdle: !!heartbeat.motionIdle,
        motionSamples: heartbeat.motionSamples || 0,
        activeMotionSamples: heartbeat.activeMotionSamples || 0,
        maxAcceleration: heartbeat.maxAcceleration || 0,
        collectedAt: new Date().toISOString(),
        isNative: isNative(),
      };

      setSensorData(data);
      return data;
    } catch (err) {
      const msg = err.message || 'Failed to collect sensor data';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { sensorData, loading, error, collectSensorData };
}
