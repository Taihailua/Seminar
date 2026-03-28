/**
 * map.js — Full Map + Restaurant + QR Scanner (Camera + Upload FIXED)
 */

import { api, getAuth, clearAuth } from './api.js';

let map;
let markersLayer;
let restaurantData = [];
let qrInstance = null;   // Global instance để dễ quản lý

// ==================== MAP ====================
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

// ==================== MARKER ====================
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

function renderMarkers(restaurants) {
  markersLayer.clearLayers();

  restaurants.forEach((r) => {
    if (!r.latitude || !r.longitude) return;

    const marker = L.marker([r.latitude, r.longitude], { icon: createOrangeMarker(false) });

    marker.bindPopup(`
      <div style="background:#1a1a2e;color:#e9e6f9;padding:12px;border-radius:12px;min-width:200px;">
        <div style="font-weight:700;color:#0ea5e9">${r.name}</div>
        <div style="font-size:12px;color:#aaa">
          ${r.avg_rating ? `⭐ ${r.avg_rating.toFixed(1)}` : '⭐ Mới'}
        </div>
        <a href="restaurant.html?id=${r.id}" style="display:block;margin-top:8px;padding:8px;text-align:center;background:#0ea5e9;color:#000;border-radius:8px;text-decoration:none;font-weight:600;">
          Xem chi tiết →
        </a>
      </div>
    `, { maxWidth: 250 });

    marker.on('click', () => {
      markersLayer.eachLayer((m) => m !== marker && m.setIcon(createOrangeMarker(false)));
      marker.setIcon(createOrangeMarker(true));
    });

    markersLayer.addLayer(marker);
  });
}

// ==================== RESTAURANT LIST ====================
function renderRestaurantList(restaurants) {
  document.querySelectorAll('.restaurant-cards').forEach(container => {
    container.innerHTML = '';
    restaurants.forEach(r => {
      const card = document.createElement('div');
      card.style.cssText = `flex-shrink:0;width:160px;background:#242437;border-radius:14px;padding:14px;cursor:pointer;`;
      card.innerHTML = `
        <div style="height:80px;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:32px;border-radius:10px;margin-bottom:10px;">🍜</div>
        <div style="color:#e9e6f9;font-weight:700;font-size:13px;">${r.name}</div>
        <div style="color:#0ea5e9;font-size:11px;">${r.avg_rating ? `⭐ ${r.avg_rating.toFixed(1)}` : '⭐ Mới'}</div>
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

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    drawer.style.transform = 'translateX(0)';
    overlay.style.display = 'block';
  });

  overlay?.addEventListener('click', () => {
    drawer.style.transform = 'translateX(-100%)';
    overlay.style.display = 'none';
  });

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    clearAuth();
    window.location.href = 'login.html';
  });
}

// ==================== QR SCANNER (ĐÃ SỬA) ====================
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
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;justify-content:center;align-items:center;`;

  modal.innerHTML = `
    <div style="background:#181828;padding:24px;border-radius:16px;width:90%;max-width:420px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="color:#0ea5e9;margin:0;">📷 Quét Mã QR</h3>
        <button id="close-qr" style="background:none;border:none;color:#aba9bb;font-size:26px;cursor:pointer;">✕</button>
      </div>
      <div id="qr-reader" style="min-height:280px;background:#000;border-radius:12px;overflow:hidden;"></div>
      <div style="margin-top:16px;text-align:center;">
        <label style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#000;border-radius:10px;cursor:pointer;font-weight:700;">
          📁 Tải ảnh QR từ thư viện
          <input type="file" id="qr-file" accept="image/*" style="display:none;">
        </label>
      </div>
      <p style="color:#aba9bb;font-size:13px;text-align:center;margin-top:16px;">Hướng camera vào QR hoặc chọn ảnh</p>
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
  stopScanner(); // đảm bảo không có instance cũ

  qrInstance = new Html5Qrcode("qr-reader");

  qrInstance.start(
    { facingMode: "environment" },
    { fps: 12, qrbox: { width: 260, height: 260 } },
    onScanSuccess,
    (error) => {} // im lặng lỗi quét liên tục
  ).catch(err => {
    console.error("Không mở được camera:", err);
    alert("Không thể truy cập camera. Vui lòng kiểm tra quyền.");
  });
}

function setupFileUpload() {
  const fileInput = document.getElementById('qr-file');
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      stopScanner(); // dừng camera trước khi scan file

      const qr = new Html5Qrcode("qr-reader"); // tạo instance mới cho scanFile
      const decodedText = await qr.scanFile(file, true); // true = scan both inverted & normal

      onScanSuccess(decodedText);
    } catch (err) {
      console.error("Scan file error:", err);
      alert("Không đọc được QR từ ảnh.\n\n→ Hãy thử ảnh rõ nét, không mờ, không phản chiếu.");
    }
  });
}

function onScanSuccess(decodedText) {
  stopScanner();
  document.getElementById('qr-modal')?.remove();

  console.log("✅ QR Decoded:", decodedText); // giúp debug

  try {
    const url = new URL(decodedText);

    const id = url.searchParams.get('id');
    if (id) {
      window.location.href = `restaurant.html?id=${id}`;
    } else {
      window.location.href = decodedText;
    }
  } catch (e) {
    // Không phải URL → hiển thị nội dung text
    showQRContentModal(decodedText);
  }
}

function showQRContentModal(content) {
  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:10000;display:flex;align-items:center;justify-content:center;`;

  modal.innerHTML = `
    <div style="background:#181828;border-radius:20px;padding:28px;width:90%;max-width:420px;text-align:center;">
      <div style="font-size:52px;margin-bottom:12px;">✅</div>
      <h3 style="color:#0ea5e9;margin-bottom:20px;">Đã quét thành công!</h3>
      <div style="background:#242437;padding:18px;border-radius:12px;margin-bottom:24px;text-align:left;word-break:break-all;">
        <div style="color:#aba9bb;font-size:13px;margin-bottom:8px;">Nội dung:</div>
        <div style="color:#e9e6f9;line-height:1.5;">${content}</div>
      </div>
      <div style="display:flex;gap:12px;">
        <button id="copy-btn" style="flex:1;padding:14px;background:#242437;color:#fff;border:none;border-radius:12px;font-weight:600;">📋 Sao chép</button>
        <button id="close-btn" style="flex:1;padding:14px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#000;border:none;border-radius:12px;font-weight:700;">Đóng</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(content);
    const btn = document.getElementById('copy-btn');
    btn.textContent = '✅ Đã sao chép!';
    setTimeout(() => btn.textContent = '📋 Sao chép', 2000);
  });

  document.getElementById('close-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function stopScanner() {
  if (qrInstance) {
    qrInstance.stop().catch(() => {}).finally(() => {
      qrInstance = null;
    });
  }
}

function closeScanner() {
  stopScanner();
  document.getElementById('qr-modal')?.remove();
}

// ==================== MAIN INIT ====================
async function init() {
  setupDrawer();
  setupQrButtons();

  if (!window.L) await loadLeaflet();
  initMap();

  try {
    restaurantData = await api.get('/api/restaurants');
    renderMarkers(restaurantData);
    renderRestaurantList(restaurantData);
  } catch (err) {
    console.error('Lỗi tải danh sách quán:', err);
  }
}

function loadLeaflet() {
  return new Promise(resolve => {
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