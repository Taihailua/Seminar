// map.js - Phiên bản hoàn chỉnh sau khi merge
import { api, getAuth, clearAuth } from './api.js';

let map;
let markersLayer;
let userMarker;
let restaurantData = [];
let qrInstance = null;

let ttsUtterance = null;
let isSpeaking = false;

const VK_CENTER = [10.7553, 106.7009];

// ==================== INIT MAP ====================
function initMap() {
    map = L.map('map-container', {
        center: VK_CENTER,
        zoom: 17,
        zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CartoDB',
        maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    map.on('click', handleMapClick);
}

// ==================== TTS & GEOFENCE LOGIC ====================
function handleMapClick(e) {
    if (!userMarker) {
        userMarker = L.marker(e.latlng, { icon: createUserMarkerIcon() }).addTo(map);
    } else {
        userMarker.setLatLng(e.latlng);
    }

    // Stop current TTS if any
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
    }

    const clickedLatLng = e.latlng;
    let candidates = [];

    restaurantData.forEach(r => {
        if (!r.latitude || !r.longitude) return;
        const dist = map.distance(clickedLatLng, [r.latitude, r.longitude]);
        if (dist <= 20) {
            candidates.push({ ...r, distance: dist });
        }
    });

    if (candidates.length === 0) return;

    // Sort by distance, tie-breaker: owner_id
    candidates.sort((a, b) => {
        if (Math.abs(a.distance - b.distance) < 0.1) {
            return (a.owner_id || 0) - (b.owner_id || 0);
        }
        return a.distance - b.distance;
    });

    const targetRestaurant = candidates[0];
    playAudioGuide(targetRestaurant);
}

async function playAudioGuide(restaurant) {
    if (!window.speechSynthesis) return;
    
    // Get language
    let lang = localStorage.getItem('appLang') || 'vi-VN';
    if (lang.length === 2 || lang === 'zh-CN') {
        const mapLang = { 'vi': 'vi-VN', 'en': 'en-US', 'ko': 'ko-KR', 'zh-CN': 'zh-CN', 'fr': 'fr-FR', 'ja': 'ja-JP' };
        if (mapLang[lang]) lang = mapLang[lang];
    }

    try {
        // Fetch translated text if necessary
        const query = (lang && lang !== 'vi-VN') ? `?lang=${lang}` : '';
        const data = await api.get(`/api/restaurants/${restaurant.id}${query}`);
        const text = data.audio_text;

        if (!text) return;

        ttsUtterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        // Cải thiện logic tìm giọng đọc (đặc biệt cho tiếng Trung)
        const targetLang = lang.toLowerCase();
        const baseLang = lang.split('-')[0].toLowerCase();
        
        let voice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === targetLang) || 
                    voices.find(v => v.lang.toLowerCase().startsWith(baseLang));
                    
        // Nếu không tìm thấy bằng mã ngôn ngữ, thử tìm theo tên giọng đọc
        if (!voice && baseLang === 'zh') {
            voice = voices.find(v => v.name.toLowerCase().includes('chinese') || v.name.toLowerCase().includes('taiwan'));
        }
        
        if (voice) {
            ttsUtterance.voice = voice;
            ttsUtterance.lang = voice.lang; // Sử dụng mã ngôn ngữ chuẩn của giọng đọc đó
        } else {
            ttsUtterance.lang = lang;
        }

        ttsUtterance.onstart = () => isSpeaking = true;
        ttsUtterance.onend = () => isSpeaking = false;
        ttsUtterance.onerror = () => isSpeaking = false;

        window.speechSynthesis.speak(ttsUtterance);
    } catch (err) {
        console.warn("Failed to play audio guide:", err);
    }
}


// ==================== MARKERS ====================
function createOrangeMarker(isSelected = false) {
    const size = isSelected ? 44 : 36;
    return L.divIcon({
        className: '',
        html: `
            <div style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 16px rgba(14,165,233,0.5);">
                <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;height:100%;font-size:${size * 0.45}px;">🍜</div>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
}

function createUserMarkerIcon() {
    return L.divIcon({
        className: '',
        html: `<div class="user-location-pulse"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

function renderMarkers(restaurants) {
    markersLayer.clearLayers();
    restaurants.forEach(r => {
        if (!r.latitude || !r.longitude) return;

        // Draw 20m circle
        L.circle([r.latitude, r.longitude], {
            color: '#0ea5e9',
            fillColor: '#0ea5e9',
            fillOpacity: 0.1,
            weight: 1,
            radius: 20
        }).addTo(markersLayer);

        const marker = L.marker([r.latitude, r.longitude], { icon: createOrangeMarker(false) });

        marker.bindPopup(`
            <div style="background:#1a1a2e;color:#e9e6f9;padding:12px;border-radius:12px;min-width:180px;max-width:240px;">
                <div style="font-weight:700;color:#0ea5e9;font-size:14px;margin-bottom:4px;">${r.name}</div>
                <div style="font-size:12px;color:#aba9bb;margin-bottom:8px;">
                    ${r.avg_rating ? `⭐ ${r.avg_rating.toFixed(1)}` : '⭐ Mới'} · 📍 ${r.address || 'Phố Vĩnh Khánh'}
                </div>
                <a href="restaurant.html?id=${r.id}"
                   style="display:block;padding:8px;text-align:center;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#000;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
                    Xem chi tiết →
                </a>
            </div>
        `, { maxWidth: 260 });

        marker.on('click', () => {
            markersLayer.eachLayer(m => {
                if (m !== marker) m.setIcon(createOrangeMarker(false));
            });
            marker.setIcon(createOrangeMarker(true));
        });

        markersLayer.addLayer(marker);
    });
}

// ==================== RESTAURANT LIST ====================
function renderRestaurantList(restaurants) {
    const containers = document.querySelectorAll('.restaurant-cards');
    containers.forEach(container => {
        container.innerHTML = '';

        restaurants.forEach(r => {
            const card = document.createElement('div');
            // Tailwind responsive card — snap-center to smooth swipe on mobile
            card.className = 'flex-shrink-0 w-32 sm:w-40 snap-center bg-[#242437] rounded-[14px] p-3 sm:p-3.5 cursor-pointer hover:bg-[#2a2a45] active:scale-[0.97] transition-all overflow-hidden flex flex-col';
            card.innerHTML = `
                <div class="h-16 sm:h-20 bg-[#1a1a2e] flex items-center justify-center text-3xl rounded-[10px] mb-2 sm:mb-2.5 overflow-hidden">
                    ${r.image_url ? `<img src="${r.image_url}" alt="${r.name}" class="w-full h-full object-cover" loading="lazy" />` : '🍲'}
                </div>
                <div class="text-[#e9e6f9] font-bold text-xs sm:text-[13px] leading-tight mb-1 line-clamp-2">${r.name}</div>
                <div class="text-[#0ea5e9] text-[10px] sm:text-[11px] font-semibold">${r.avg_rating ? `⭐ ${r.avg_rating.toFixed(1)}` : '⭐ Mới'}</div>
            `;
            card.addEventListener('click', () => window.location.href = `restaurant.html?id=${r.id}`);
            container.appendChild(card);
        });
    });
}

// ==================== DRAWER ====================
function setupDrawer() {
    const drawer = document.getElementById('side-menu');
    const overlay = document.getElementById('drawer-overlay');

    document.getElementById('menu-toggle').addEventListener('click', () => {
        drawer.style.transform = 'translateX(0)';
        overlay.classList.remove('hidden');
    });

    overlay.addEventListener('click', () => {
        drawer.style.transform = 'translateX(-100%)';
        overlay.classList.add('hidden');
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        clearAuth();
        window.location.href = 'login.html';
    });
}

// ==================== QR SCANNER ====================
function setupQrButtons() {
    document.querySelectorAll('#qr-scan-btn, #qr-scan-btn-fab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openScannerModal();
        });
    });
}

function openScannerModal() {
    if (document.getElementById('qr-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'qr-modal';
    modal.className = 'fixed inset-0 bg-black/90 z-[9999] flex justify-center items-center p-4';

    modal.innerHTML = `
        <div class="bg-[#181828] p-5 sm:p-6 rounded-2xl w-full max-w-sm sm:max-w-md border border-[#242437] shadow-2xl">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-[#0ea5e9] font-bold text-base flex items-center gap-2">
                    <span class="material-symbols-outlined text-xl notranslate">qr_code_scanner</span>
                    📷 Quét Mã QR
                </h3>
                <button id="close-qr" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-[#aba9bb] hover:text-white text-lg transition-colors">✕</button>
            </div>
            <div id="qr-reader" class="min-h-[240px] sm:min-h-[280px] bg-black rounded-xl overflow-hidden"></div>
            <div class="mt-4 text-center">
                <label class="inline-flex items-center gap-2 px-5 py-3 bg-[#0ea5e9] text-[#521f00] rounded-xl cursor-pointer font-bold text-sm hover:bg-[#0284c7] transition-colors active:scale-[0.98]">
                    📁 Tải ảnh QR từ thư viện
                    <input type="file" id="qr-file" accept="image/*" class="hidden" />
                </label>
            </div>
            <p class="text-[#aba9bb] text-xs text-center mt-3">Hướng camera vào QR hoặc chọn ảnh</p>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('close-qr').addEventListener('click', closeScanner);

    if (!window.Html5Qrcode) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.onload = () => {
            startCameraScanner();
            setupFileUpload();
        };
        document.head.appendChild(script);
    } else {
        startCameraScanner();
        setupFileUpload();
    }
}

function startCameraScanner() {
    stopScanner();
    qrInstance = new Html5Qrcode("qr-reader");
    qrInstance.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 240, height: 240 } },
        onScanSuccess,
        () => {}
    ).catch(err => {
        console.error("Camera error:", err);
        alert("Không thể truy cập camera. Vui lòng kiểm tra quyền.");
    });
}

function setupFileUpload() {
    const fileInput = document.getElementById('qr-file');
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            stopScanner();
            const qr = new Html5Qrcode("qr-reader");
            const decodedText = await qr.scanFile(file, true);
            onScanSuccess(decodedText);
        } catch (err) {
            alert("Không đọc được QR từ ảnh. Hãy thử ảnh rõ nét hơn.");
        }
    });
}

function onScanSuccess(decodedText) {
    stopScanner();
    document.getElementById('qr-modal')?.remove();

    try {
        const url = new URL(decodedText);
        const id = url.searchParams.get('id');
        window.location.href = id ? `restaurant.html?id=${id}` : decodedText;
    } catch (e) {
        showQRContentModal(decodedText);
    }
}

function showQRContentModal(content) {
    // ... (giữ nguyên hàm này nếu bạn cần, hoặc bỏ nếu không dùng)
    alert("Nội dung QR: " + content);
}

function stopScanner() {
    if (qrInstance) {
        qrInstance.stop().catch(() => {}).finally(() => qrInstance = null);
    }
}

function closeScanner() {
    stopScanner();
    document.getElementById('qr-modal')?.remove();
}

// ==================== GEOLOCATION ====================
function setupGeolocation() {
    map.on('locationfound', (e) => {
        if (!userMarker) {
            userMarker = L.marker(e.latlng, { icon: createUserMarkerIcon() }).addTo(map);
        } else {
            userMarker.setLatLng(e.latlng);
        }
    });

    map.locate({ watch: true, enableHighAccuracy: true });

    document.getElementById('btn-center-user').addEventListener('click', () => {
        if (userMarker) {
            map.flyTo(userMarker.getLatLng(), 18);
        } else {
            map.locate({ setView: true, maxZoom: 18 });
        }
    });

    document.getElementById('btn-center-restaurants').addEventListener('click', () => {
        map.flyTo(VK_CENTER, 17);
    });
}

// ==================== MAIN ====================
async function init() {
    setupDrawer();
    setupQrButtons();

    // Setup Language Selector
    const langSelector = document.getElementById('map-lang-selector');
    if (langSelector) {
        const savedLang = localStorage.getItem('appLang');
        if (savedLang) {
            // map standard code if it's short
            const mapLang = { 'vi': 'vi-VN', 'en': 'en-US', 'ko': 'ko-KR', 'zh-CN': 'zh-CN', 'fr': 'fr-FR', 'ja': 'ja-JP' };
            const fullCode = mapLang[savedLang] || savedLang;
            if (Array.from(langSelector.options).some(opt => opt.value === fullCode)) {
                langSelector.value = fullCode;
            }
        }
        langSelector.addEventListener('change', (e) => {
            const val = e.target.value;
            let gtCode = val.split('-')[0];
            if (val.startsWith('zh')) gtCode = 'zh-CN';
            localStorage.setItem('appLang', gtCode);
            if (window.changeLanguage) {
                window.changeLanguage(gtCode);
            }
        });
    }

    if (!window.L) {
        await new Promise(resolve => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    initMap();
    setupGeolocation();

    try {
        restaurantData = await api.get('/api/restaurants');
        renderMarkers(restaurantData);
        renderRestaurantList(restaurantData);
    } catch (err) {
        console.error('Lỗi tải quán ăn:', err);
    }
}

document.addEventListener('DOMContentLoaded', init);