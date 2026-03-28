/**
 * map.js — Interactive Leaflet map with dynamic restaurant markers + QR Scanner
 */

import { api, getAuth, clearAuth } from './api.js';

let map;
let markersLayer;
let restaurantData = [];

// ==================== INIT MAP ====================
function initMap() {
  const VK_CENTER = [10.7553, 106.7009];

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
}

function createOrangeMarker(isSelected = false) {
  const size = isSelected ? 44 : 36;
  const glow = isSelected ? 'filter:drop-shadow(0 0 12px #0ea5e9);' : '';
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 16px rgba(14,165,233,0.5);${glow}">
      <div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;height:100%;font-size:${size * 0.45}px;">🍜</div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function renderMarkers(restaurants) {
  markersLayer.clearLayers();

  restaurants.forEach((r) => {
    if (!r.latitude || !r.longitude) return;

    const marker = L.marker([r.latitude, r.longitude], { icon: createOrangeMarker(false) });

    const ratingDisplay = r.avg_rating ? `⭐ ${r.avg_rating.toFixed(1)}` : '⭐ Chưa có';
    marker.bindPopup(`
      <div style="background:#1a1a2e;color:#e9e6f9;padding:12px;border-radius:12px;min-width:200px;font-family:'Plus Jakarta Sans',sans-serif;">
        <div style="font-weight:700;font-size:15px;color:#0ea5e9;margin-bottom:4px;">${r.name}</div>
        <div style="font-size:12px;color:#aba9bb;margin-bottom:8px;">${ratingDisplay} · 📍 ${r.address || 'Phố Vĩnh Khánh'}</div>
        <a href="restaurant.html?id=${r.id}" style="display:block;text-align:center;padding:8px 16px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#521f00;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">Xem chi tiết →</a>
      </div>
    `, { maxWidth: 250 });

    marker.on('click', () => {
      markersLayer.eachLayer((m) => m !== marker && m.setIcon(createOrangeMarker(false)));
      marker.setIcon(createOrangeMarker(true));
    });

    markersLayer.addLayer(marker);
  });
}

function renderRestaurantList(restaurants) {
  const containers = document.querySelectorAll('.restaurant-cards');
  containers.forEach(container => {
    container.innerHTML = '';
    restaurants.forEach(r => {
      const card = document.createElement('div');
      card.style.cssText = `flex-shrink:0;width:160px;background:#242437;border-radius:14px;padding:14px;cursor:pointer;`;
      card.innerHTML = `
        <div style="width:100%;height:80px;border-radius:10px;background:linear-gradient(135deg,#1a1a2e,#242437);display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:10px;">🍜</div>
        <div style="font-weight:700;color:#e9e6f9;font-size:13px;">${r.name}</div>
        <div style="font-size:11px;color:#0ea5e9;">${r.avg_rating ? `⭐ ${r.avg_rating.toFixed(1)}` : '⭐ Mới'}</div>
      `;
      card.addEventListener('click', () => window.location.href = `restaurant.html?id=${r.id}`);
      container.appendChild(card);
    });
  });
}

function populateNavDrawer() {
  const { username, role } = getAuth();
  document.querySelectorAll('.user-name').forEach(el => el.textContent = username || 'Khách');
  document.querySelectorAll('.nav-role').forEach(el => {
    el.textContent = role === 'owner' ? '🏪 Chủ quán' : '👤 Khách hàng';
  });
}

function setupDrawer() {
  const drawer = document.getElementById('side-menu');
  const overlay = document.getElementById('drawer-overlay');

  document.querySelectorAll('#menu-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      drawer.style.transform = 'translateX(0)';
      overlay.style.display = 'block';
    });
  });

  overlay.addEventListener('click', () => {
    drawer.style.transform = 'translateX(-100%)';
    overlay.style.display = 'none';
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    clearAuth();
    window.location.href = 'login.html';
  });
}

// ==================== QR SCANNER ====================

function setupQrButtons() {
  const qrButtons = document.querySelectorAll('#qr-scan-btn, #qr-scan-btn-fab');

  qrButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('QR Button clicked:', btn.id);   // Debug
      openScannerModal();
    });
  });
}

function openScannerModal() {
  // Prevent duplicate modal
  if (document.getElementById('qr-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'qr-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
  `;

  modal.innerHTML = `
    <div style="background:#181828;border-radius:16px;padding:24px;width:90%;max-width:400px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="color:#0ea5e9;margin:0;">📷 Quét Mã QR</h3>
        <button id="close-scanner" style="background:none;border:none;color:#aba9bb;font-size:24px;cursor:pointer;">✕</button>
      </div>

      <div id="qr-reader" style="border-radius:12px;overflow:hidden;margin-bottom:16px;min-height:280px;background:#000;"></div>

      <div style="margin-top:12px;text-align:center;">
        <label style="display:inline-block;padding:12px 20px;background:#0ea5e9;color:#000;border-radius:8px;cursor:pointer;font-weight:bold;">
          📁 Tải ảnh QR từ thư viện
          <input type="file" id="qr-file" accept="image/*" style="display:none;">
        </label>
      </div>

      <p style="color:#aba9bb;font-size:13px;text-align:center;margin-top:16px;">
        Hướng camera vào mã QR hoặc tải ảnh lên
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('close-scanner').addEventListener('click', () => {
    const reader = window._html5QrcodeScanner;
    if (reader) reader.stop().catch(() => {});
    modal.remove();
  });

  // Load Html5Qrcode library
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
  const html5QrCode = new Html5Qrcode('qr-reader');
  window._html5QrcodeScanner = html5QrCode;

  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    handleQRResult,
    () => {}
  ).catch(err => console.error('Camera error:', err));
}

function setupFileUpload() {
  const fileInput = document.getElementById('qr-file');
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleQRResult(decodedText);
    } catch (err) {
      alert('Không đọc được mã QR từ ảnh!');
      console.error(err);
    }
  });
}

function handleQRResult(decodedText) {
  const reader = window._html5QrcodeScanner;
  if (reader) reader.stop().catch(() => {});

  document.getElementById('qr-modal')?.remove();

  try {
    const url = new URL(decodedText);
    const id = url.searchParams.get('id');
    if (id) {
      window.location.href = `restaurant.html?id=${id}`;
    } else {
      window.location.href = decodedText;
    }
  } catch {
    alert('QR không hợp lệ: ' + decodedText);
  }
}

// ==================== MAIN INIT ====================
async function init() {
  const { username } = getAuth();
  document.querySelectorAll('.avatar, .user-avatar').forEach(el => {
    if (el.tagName !== 'IMG') el.textContent = username ? username[0].toUpperCase() : '?';
  });

  setupDrawer();
  setupQrButtons();        // ← Đã sửa ở đây
  populateNavDrawer();

  // Load map
  if (!window.L) await loadLeaflet();
  initMap();

  // Load restaurants
  try {
    restaurantData = await api.get('/api/restaurants');
    renderMarkers(restaurantData);
    renderRestaurantList(restaurantData);
  } catch (err) {
    console.error('Failed to load restaurants:', err);
  }
}

function loadLeaflet() {
  return new Promise((resolve) => {
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

document.addEventListener('DOMContentLoaded', init);