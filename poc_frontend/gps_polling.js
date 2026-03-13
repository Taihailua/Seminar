import { calculateHaversineDistance, isPointInPolygon } from './algorithms.js';

class AdaptiveGPSController {
    constructor(onLocationUpdate) {
        this.onLocationUpdate = onLocationUpdate;
        this.lastLat = null;
        this.lastLon = null;
        this.lastTimestamp = null;
        this.currentPollingInterval = 10000; // Default 10s (Walking)
        this.watchId = null;
    }

    start() {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }
        this._pollLocation();
    }

    _pollLocation() {
        navigator.geolocation.getCurrentPosition(
            (position) => this._handlePosition(position),
            (error) => console.error("GPS Error", error),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
        
        // Schedule next poll dynamically based on speed
        this.watchId = setTimeout(() => this._pollLocation(), this.currentPollingInterval);
    }

    _handlePosition(position) {
        const { latitude, longitude } = position.coords;
        const currentTimestamp = position.timestamp;

        if (this.lastLat !== null && this.lastLon !== null) {
            // Spatial Distance Filter (5 meters)
            const distanceKM = calculateHaversineDistance(this.lastLat, this.lastLon, latitude, longitude);
            const distanceMeters = distanceKM * 1000;
            
            if (distanceMeters < 5) {
                // Ignore drfit variations under 5 meters
                return; 
            }

            // Calculate instantaneous velocity
            const timeDiffSec = (currentTimestamp - this.lastTimestamp) / 1000;
            const velocity = distanceMeters / timeDiffSec;

            // Finite State Machine for Adaptive Polling
            if (velocity < 1.0) { // < 3.6 km/h -> Stationary
                this.currentPollingInterval = 30000; // 30s
            } else if (velocity >= 1.0 && velocity < 5.0) { // 3.6 - 18 km/h -> Walking
                this.currentPollingInterval = 10000; // 10s
            } else { // > 18 km/h -> Driving
                this.currentPollingInterval = 3000; // 3s
            }
        }

        this.lastLat = latitude;
        this.lastLon = longitude;
        this.lastTimestamp = currentTimestamp;

        // Propagate valid location up
        this.onLocationUpdate({ lat: latitude, lon: longitude });
    }

    stop() {
        if (this.watchId) {
            clearTimeout(this.watchId);
        }
    }
}

export default AdaptiveGPSController;
