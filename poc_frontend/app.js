import AdaptiveGPSController from './gps_polling.js';
import { isPointInPolygon, generateFingerprint } from './algorithms.js';

// Configuration
const API_BASE = "http://localhost:8000";
let currentToken = localStorage.getItem("vinh_khanh_session");
let deviceHash = "";

// Map Initialization
const map = L.map('map', { zoomControl: false }).setView([10.7610, 106.7001], 18); // Approx Vinh Khanh street

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: 'MapBox/Leaflet POC',
    maxZoom: 20
}).addTo(map);

// Add Dummy Oc Oanh Polygon
const ocOanhCoords = [
    { lat: 10.7611, lon: 106.7000 },
    { lat: 10.7611, lon: 106.7002 },
    { lat: 10.7609, lon: 106.7002 },
    { lat: 10.7609, lon: 106.7000 }
];
const ocOanhLeafletCoords = ocOanhCoords.map(c => [c.lat, c.lon]);
const stallPolygon = L.polygon(ocOanhLeafletCoords, { color: '#333', weight: 2, fillOpacity: 0.2 }).addTo(map);

// User Marker
const userMarker = L.circleMarker([10.7610, 106.7001], {
    radius: 8,
    fillColor: '#007aff',
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
}).addTo(map);

// Audio State
let activeMerchantId = null;
let audioContext = null;
let audioSource = null;
let gainNode = null;

// UI Elements
const playerCard = document.getElementById('player-card');
const stallTitle = document.getElementById('stall-title');
const toastEl = document.getElementById('toast');

function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// -------------------------------------------------------------
// Audio Control Logic
// -------------------------------------------------------------
async function triggerEnterBoundary(merchantName, merchantId) {
    if (activeMerchantId === merchantId) return;
    activeMerchantId = merchantId;
    
    // UI Update (Highlighted state)
    stallPolygon.setStyle({ color: '#f26c0d', fillColor: '#f26c0d', fillOpacity: 0.4 });
    stallTitle.textContent = merchantName;
    playerCard.classList.add('active');

    // 1. Initial Scan API Call (Billing & Token Generation)
    try {
        deviceHash = await generateFingerprint();
        const scanQuery = `${API_BASE}/scan?merchant_id=${merchantId}${currentToken ? `&client_token=${currentToken}` : ''}`;
        const scanRes = await fetch(scanQuery);
        if (scanRes.ok) {
            const data = await scanRes.json();
            if (data.token) {
                currentToken = data.token;
                localStorage.setItem("vinh_khanh_session", currentToken);
            }
        }
    } catch(e) {
        console.error("Scan API Failed", e);
    }

    // 2. Play Audio Stream using Web Audio API
    playAudioStream(merchantId);
}

function triggerExitBoundary() {
    if (!activeMerchantId) return;
    
    // UI Update (Revert highlight)
    stallPolygon.setStyle({ color: '#333', fillColor: '#333', fillOpacity: 0.2 });
    playerCard.classList.remove('active');
    activeMerchantId = null;

    showToast("Bạn đã rời khỏi khu vực. Luồng âm thanh đã được ngưng.");

    // Fade Out Audio (Boundary Event Halting)
    if (audioContext && gainNode) {
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);
        setTimeout(() => {
            if (audioContext.state === 'running') {
                audioContext.suspend();
            }
        }, 1500);
    }
}

async function playAudioStream(merchantId) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Bypassing Safari AutoPlay by resuming on first interaction if needed, 
    // but here we trigger programmatically assuming earlier interaction on start or scan
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    const payload = {
        text: `Chào mừng bạn đến với khu phố ẩm thực Vĩnh Khánh. Bạn đang đứng tại ${merchantId}, một trong những quán ốc nổi tiếng nhất với các món ốc móng tay xào me dừa cực kỳ hấp dẫn.`,
    };

    try {
        const response = await fetch(`${API_BASE}/audio/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Audio stream failed");

        // Simple streaming playback via HTMLAudioElement for ease of integration
        // (Full WebAudio stream decoding is complex, blob URL is robust for POC)
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        const audioEl = new Audio(audioUrl);
        
        // Connect to Web Audio API for gain control (Fade out)
        const track = audioContext.createMediaElementSource(audioEl);
        gainNode = audioContext.createGain();
        track.connect(gainNode).connect(audioContext.destination);
        
        audioEl.play();

    } catch(e) {
        console.error("Stream error", e);
    }
}

// -------------------------------------------------------------
// GPS Polling & Ray-Casting Integration
// -------------------------------------------------------------
const gpsController = new AdaptiveGPSController((location) => {
    // 1. Smooth Panning / UI Update
    userMarker.setLatLng([location.lat, location.lon]);
    map.panTo([location.lat, location.lon], { animate: true, duration: 1 });

    // 2. PNPoly Ray-Casting Check
    // Using a mocked merchant ID for the POC since we only have one polygon
    const merchantId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"; // Fake UUID
    const isInside = isPointInPolygon(location, ocOanhCoords);

    if (isInside) {
        triggerEnterBoundary("Oc Oanh", merchantId);
    } else {
        triggerExitBoundary();
    }
});

// For POC purposes, we don't start polling immediately since desktop doesn't walk around
// We attach it to a click event on the map to simulate location jumps
map.on('click', function(e) {
    // Simulate a GPS update manually
    gpsController._handlePosition({
        coords: { latitude: e.latlng.lat, longitude: e.latlng.lng },
        timestamp: Date.now()
    });
});
