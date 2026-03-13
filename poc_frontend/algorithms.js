// Device Fingerprinting
export async function generateFingerprint() {
    const userAgent = navigator.userAgent;
    const acceptLang = navigator.languages ? navigator.languages.join(',') : navigator.language;
    
    // Simple WebGL/Canvas fingerprinting (Mocked for POC brevity, usually draws text and hashes)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    let webglInfo = "no-webgl";
    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            webglInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
    }
    
    // Generate SHA-256 hash using Web Crypto API
    const rawData = `${userAgent}|${acceptLang}|${webglInfo}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Haversine Distance Calculation (Earth radius in km = 6371)
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// PNPoly Ray-Casting Algorithm with Boolean Logic Optimization
export function isPointInPolygon(point, polygon) {
    const x = point.lon, y = point.lat;
    let is_inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lon, yi = polygon[i].lat;
        const xj = polygon[j].lon, yj = polygon[j].lat;
        
        // Y-bound Filter Optimization
        const intersect = ((yi > y) !== (yj > y));
        
        // X-intersection Check
        if (intersect && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            is_inside = !is_inside;
        }
    }
    return is_inside;
}
