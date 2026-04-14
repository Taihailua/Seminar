/**
 * map.js — Interactive Leaflet map with dynamic restaurant markers
 * + Added Upload QR Image button inside the QR Scanner Modal
 */
import { api, getAuth, clearAuth } from './api.js';

let map;
let markersLayer;
let restaurantData = [];

/** Initialize Leaflet map */
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
  const listContainers = document.querySelectorAll('.restaurant-list, .nearby-list, [class*="quán-ăn"], .drawer-list, .restaurant-cards, .scroll-container');

  listContainers.forEach((container) => {
    container.innerHTML = '';
    restaurants.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'restaurant-card-item';
      card.style.cssText = `background:#242437;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;display:flex;align-items:center;gap:12px;`;
      card.innerHTML = `
        <div style="width:56px;height:56px;border-radius:10px;background:linear-gradient(135deg,#1a1a2e,#242437);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🍜</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:#e9e6f9;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>
          <div style="font-size:12px;color:#0ea5e9;margin-top:2px;">${r.avg_rating ? `⭐ ${r.avg_rating.toFixed(1)}` : '⭐ Mới'}</div>
          <div style="font-size:11px;color:#aba9bb;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📍 ${r.address || 'Phố Vĩnh Khánh'}</div>
        </div>
      `;
      card.addEventListener('click', () => window.location.href = `restaurant.html?id=${r.id}`);
      container.appendChild(card);
    });
  });
}

function populateNavDrawer() {
  const { username, role } = getAuth();
  document.querySelectorAll('.drawer-username, .nav-username, [class*="user-name"]').forEach(el => el.textContent = username || 'Khách');
  document.querySelectorAll('.drawer-role, .nav-role').forEach(el => {
    el.textContent = role === 'owner' ? '🏪 Chủ quán' : role === 'admin' ? '⚙️ Admin' : '👤 Khách hàng';
  });
}

function setupDrawer() {
  const menuBtns = document.querySelectorAll('#menu-toggle, .btn-menu');
  const drawer = document.getElementById('side-menu');
  const overlay = document.getElementById('drawer-overlay');

  menuBtns.forEach(btn => btn.addEventListener('click', () => {
    if (drawer) drawer.style.transform = 'translateX(0)';
    if (overlay) overlay.style.display = 'block';
  }));

  if (overlay) overlay.addEventListener('click', () => {
    if (drawer) drawer.style.transform = 'translateX(-100%)';
    overlay.style.display = 'none';
  });

  document.querySelectorAll('#btn-logout, .btn-logout, #logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'login.html';
    });
  });
}

/** QR Scanner Modal với cả Camera + Tải ảnh QR lên */
function openScannerModal() {
  const modal = document.createElement('div');
  modal.id = 'qr-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
  `;

  modal.innerHTML = `
    <div style="background:#181828;border-radius:16px;padding:24px;width:90%;max-width:400px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="color:#0ea5e9;font-family:'Plus Jakarta Sans',sans-serif;margin:0;">📷 Quét Mã QR</h3>
        <button id="close-scanner" style="background:none;border:none;color:#aba9bb;font-size:24px;cursor:pointer;">✕</button>
      </div>
      
      <div id="qr-reader" style="border-radius:12px;overflow:hidden;margin-bottom:16px;"></div>
      
      <p style="color:#aba9bb;font-size:13px;text-align:center;margin-bottom:16px;">
        Hướng camera vào mã QR tại bàn ăn
      </p>

      <!-- Nút Tải ảnh QR lên - Đặt ngay trong modal như bạn yêu cầu -->
      <button id="upload-qr-btn" style="
        width:100%; padding:14px; background:#0ea5e9; color:#000; 
        border:none; border-radius:12px; font-weight:700; font-size:15px;
        display:flex; align-items:center; justify-content:center; gap:8px;
        margin-top:8px;
      ">
        <span class="material-symbols-outlined">upload</span>
        Tải ảnh QR từ thư viện
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('close-scanner').addEventListener('click', () => {
    const reader = window._html5QrcodeScanner;
    if (reader) reader.clear().catch(() => { });
    modal.remove();
  });

  /** Start camera scanner */
  function startCameraScanner() {
    if (!window.Html5Qrcode) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.onload = () => initCamera();
      document.head.appendChild(script);
    } else {
      initCamera();
    }
  }

  function initCamera() {
    const html5QrCode = new Html5Qrcode('qr-reader');
    window._html5QrcodeScanner = html5QrCode;

    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        html5QrCode.stop().then(() => {
          document.getElementById('qr-modal')?.remove();
          // Parse restaurant ID from URL
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
        });
      },
      () => { } // ignore per-frame errors
    ).catch((err) => {
      console.error('QR start error:', err);
      alert('Không thể mở camera: ' + err);
    });
  }

  /** Main init */
  async function init() {
    // Check auth
    const { token } = getAuth();

    // If user avatar exists, populate it
    const { username } = getAuth();

    document.querySelectorAll('.avatar, .user-avatar, [class*="avatar"]').forEach(el => {
      if (el.tagName !== 'IMG') el.textContent = username ? username[0].toUpperCase() : '?';
    });

    setupDrawer();
    populateNavDrawer();

    const mapContainer = document.querySelector('#map-container, .map-container');
    if (mapContainer) {
      mapContainer.id = 'map-container';
      mapContainer.style.height = mapContainer.style.height || '60vh';
      if (!window.L) await loadLeaflet();
      initMap();
    }

    try {
      const restaurantData = await api.get('/api/restaurants');
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