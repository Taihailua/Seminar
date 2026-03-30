/**
 * owner.js — Owner dashboard: CRUD, dish management, QR display, analytics, reviews
 * Replaces all static Stitch data with live API calls.
 */
import { api, getAuth, clearAuth, requireAuth } from './api.js';

let currentRestaurant = null;
let ttsUtterance = null;
let isSpeaking = false;

// ── Auth Guard ────────────────────────────────────────────────────────────────
function checkAuth() {
  const { token, role } = getAuth();
  if (!token) { window.location.href = 'login.html'; return false; }
  if (role !== 'owner' && role !== 'admin') {
    window.location.href = 'map.html';
    return false;
  }
  return true;
}

// ── TTS Logic for Owner Preview ───────────────────────────────────────────────
function startTTS(text) {
  if (!text) { alert('Vui lòng nhập nội dung thuyết minh trước khi nghe thử.'); return; }
  if (!window.speechSynthesis) { alert('Trình duyệt không hỗ trợ Text-to-Speech.'); return; }

  stopTTS();
  window.speechSynthesis.resume();

  ttsUtterance = new SpeechSynthesisUtterance(text);
  ttsUtterance.lang = 'vi-VN';
  ttsUtterance.rate = 1.0;
  
  ttsUtterance.onstart = () => {
    isSpeaking = true;
    updateAudioButton(true);
  };
  ttsUtterance.onend = () => {
    isSpeaking = false;
    updateAudioButton(false);
  };
  ttsUtterance.onerror = (e) => {
    console.error('[TTS] Preview Error:', e);
    isSpeaking = false;
    updateAudioButton(false);
  };

  window.speechSynthesis.speak(ttsUtterance);
}

function stopTTS() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  updateAudioButton(false);
}

function updateAudioButton(playing) {
  const btn = document.getElementById('preview-audio-btn');
  if (!btn) return;
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) {
    icon.textContent = playing ? 'pause_circle' : 'play_circle';
  }
  btn.style.background = playing ? 'rgba(14,165,233,0.4)' : 'rgba(14,165,233,0.2)';
}

function wireAudioPreview() {
  const btn = document.getElementById('preview-audio-btn');
  const textArea = document.getElementById('restaurant-audio');
  if (!btn || !textArea) return;

  btn.addEventListener('click', () => {
    if (isSpeaking) {
      stopTTS();
    } else {
      startTTS(textArea.value.trim());
    }
  });
}

// ── Populate header ───────────────────────────────────────────────────────────
function populateHeader(restaurant) {
  const { username } = getAuth();
  document.querySelectorAll('.owner-username, .dashboard-username, [class*="owner-name"]').forEach(
    (el) => (el.textContent = username || 'Chủ quán')
  );

  const statusBadge = document.querySelector('.status-badge, [class*="trạng-thái"]');
  if (statusBadge && restaurant) {
    const statusMap = {
      approved: { text: '🟢 Đã duyệt', color: 'rgba(34,197,94,0.2)', textColor: '#4ade80' },
      pending: { text: '🟡 Đang chờ duyệt', color: 'rgba(251,191,36,0.2)', textColor: '#fbbf24' },
      rejected: { text: '🔴 Đã từ chối', color: 'rgba(239,68,68,0.2)', textColor: '#f87171' },
    };
    const s = statusMap[restaurant.status] || statusMap.pending;
    statusBadge.textContent = s.text;
    statusBadge.style.background = s.color;
    statusBadge.style.color = s.textColor;
  }
}

// ── Analytics cards ───────────────────────────────────────────────────────────
function populateAnalytics(restaurant) {
  if (!restaurant) return;

  const fields = {
    '.analytics-views, [data-stat="views"]': (restaurant.scan_count || 0).toLocaleString('vi-VN'),
    '.analytics-scans, [data-stat="scans"]': (restaurant.scan_count || 0).toString(),
    '.analytics-rating, [data-stat="rating"]': restaurant.avg_rating ? `${restaurant.avg_rating.toFixed(1)} ★` : '—',
    '.analytics-reviews, [data-stat="reviews"]': (restaurant.review_count || 0).toString(),
  };

  Object.entries(fields).forEach(([selector, value]) => {
    document.querySelectorAll(selector).forEach((el) => (el.textContent = value));
  });

  // Update big number fields in analytics grid
  const analyticsNumbers = document.querySelectorAll(
    '.stat-number, .analytics-number, [class*="stat-value"], [class*="big-number"]'
  );
  if (analyticsNumbers.length >= 4) {
    const values = [
      restaurant.scan_count || 0,
      restaurant.scan_count || 0,
      restaurant.avg_rating ? restaurant.avg_rating.toFixed(1) + ' ★' : '—',
      restaurant.review_count || 0,
    ];
    analyticsNumbers.forEach((el, i) => {
      if (values[i] !== undefined) el.textContent = values[i];
    });
  }
}

// ── Populate form fields ──────────────────────────────────────────────────────
function populateForm(restaurant) {
  if (!restaurant) return;

  const fieldMap = {
    '#restaurant-name, [name="name"], [placeholder*="tên nhà"]': restaurant.name,
    '#restaurant-address, [name="address"], [placeholder*="địa chỉ"]': restaurant.address || '',
    '#restaurant-description, [name="description"], [placeholder*="mô tả"]': restaurant.description || '',
    '#restaurant-audio, [name="audio_text"], [placeholder*="thuyết minh"]': restaurant.audio_text || '',
    '#restaurant-lat, [name="latitude"], [placeholder*="vĩ độ"]': restaurant.latitude || '',
    '#restaurant-lng, [name="longitude"], [placeholder*="kinh độ"]': restaurant.longitude || '',
  };

  Object.entries(fieldMap).forEach(([selector, value]) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        el.value = value || '';
      }
    });
  });
}

// ── QR code display ───────────────────────────────────────────────────────────
function displayQR(restaurant) {
  if (!restaurant?.qr_code_url) return;

  const qrImgEls = document.querySelectorAll('#qr-image, .qr-image, img[class*="qr"], [class*="qr-code"] img');
  qrImgEls.forEach((img) => {
    img.src = restaurant.qr_code_url;
    img.alt = 'QR Code - ' + restaurant.name;
    img.style.borderRadius = '8px';
    img.classList.remove('hidden'); // Ensure it's visible
  });

  const placeholder = document.getElementById('qr-placeholder');
  if (placeholder) placeholder.style.display = 'none';

  // If no img elem for QR, create it
  const qrContainer = document.querySelector('#qr-container, .qr-container, [class*="qr-section"], [class*="mã-qr"]');
  if (qrContainer && !qrImgEls.length) {
    const img = document.createElement('img');
    img.src = restaurant.qr_code_url;
    img.alt = 'QR Code';
    img.style.cssText = 'width:200px;height:200px;border-radius:12px;margin:16px auto;display:block;';
    const placeholder = qrContainer.querySelector('[class*="placeholder"], [class*="qr-placeholder"]');
    if (placeholder) placeholder.replaceWith(img);
    else qrContainer.appendChild(img);
  }

  // Download button
  const downloadBtn = document.querySelector('#download-qr, .download-qr, [class*="tải-qr"]');
  if (downloadBtn) {
    // Remove any existing listeners by using a fresh clone if needed, 
    // but here we just ensure we don't double-bind if init is called twice.
    downloadBtn.onclick = () => {
      const link = document.createElement('a');
      link.href = restaurant.qr_code_url;
      link.download = `qr-${restaurant.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  }
}

// ── QR Scanner Logic ────────────────────────────────────────────────────────
function setupQRScanner() {
  const scanBtn = document.getElementById('owner-scan-btn');
  if (!scanBtn) return;

  scanBtn.addEventListener('click', () => {
    openScannerModal();
  });
}

function openScannerModal() {
  const modal = document.createElement('div');
  modal.id = 'qr-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding: 16px;
  `;

  const tabBtnBase = `
    flex:1;padding:10px 0;border:none;cursor:pointer;font-size:13px;font-weight:700;
    font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;border-radius:8px;
  `;
  const tabActiveStyle = `background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;`;
  const tabInactiveStyle = `background:#242437;color:#aba9bb;`;

  modal.innerHTML = `
    <div style="background:#181828;border-radius:20px;padding:24px;width:100%;max-width:420px;border:1px solid #242437;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="color:#0ea5e9;font-family:'Plus Jakarta Sans',sans-serif;margin:0;font-size:16px;display:flex;align-items:center;gap:8px;">
          <span class="material-symbols-outlined notranslate" style="font-size:20px;">qr_code_scanner</span> Quét Mã QR
        </h3>
        <button id="close-scanner" style="background:rgba(255,255,255,0.06);border:none;color:#aba9bb;font-size:18px;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <button id="tab-camera" style="${tabBtnBase}${tabActiveStyle}display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined notranslate" style="font-size:16px;">photo_camera</span> Camera
        </button>
        <button id="tab-upload" style="${tabBtnBase}${tabInactiveStyle}display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined notranslate" style="font-size:16px;">upload_file</span> Tải ảnh lên
        </button>
      </div>

      <!-- Camera Panel -->
      <div id="panel-camera">
        <div id="qr-reader" style="border-radius:12px;overflow:hidden;background:#000;min-height:250px;"></div>
        <p style="color:#aba9bb;font-size:12px;text-align:center;margin-top:12px;">
          Hướng camera vào mã QR để quét tự động
        </p>
      </div>

      <!-- Upload Panel -->
      <div id="panel-upload" style="display:none;">
        <label id="upload-label" for="qr-file-input" style="
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
          border:2px dashed #474656;border-radius:12px;padding:32px 16px;cursor:pointer;
          transition:border-color 0.2s;min-height:200px;
        ">
          <span class="material-symbols-outlined notranslate" style="font-size:48px;color:#0ea5e9;opacity:0.8;">add_photo_alternate</span>
          <span style="color:#aba9bb;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;text-align:center;">
            Bấm để chọn ảnh QR<br/><span style="font-size:11px;opacity:0.6;">Hỗ trợ JPG, PNG, WEBP</span>
          </span>
        </label>
        <input id="qr-file-input" type="file" accept="image/*" style="display:none;" />
        <div id="upload-preview" style="display:none;margin-top:12px;text-align:center;">
          <img id="upload-img-preview" style="max-width:100%;max-height:200px;border-radius:10px;margin-bottom:8px;" />
        </div>
        <div id="upload-result" style="display:none;margin-top:12px;padding:12px 16px;border-radius:10px;background:#242437;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Tab switching
  const tabCamera = document.getElementById('tab-camera');
  const tabUpload = document.getElementById('tab-upload');
  const panelCamera = document.getElementById('panel-camera');
  const panelUpload = document.getElementById('panel-upload');

  tabCamera.addEventListener('click', () => {
    tabCamera.style.cssText = tabBtnBase + tabActiveStyle + 'display:flex;align-items:center;justify-content:center;gap:6px;';
    tabUpload.style.cssText = tabBtnBase + tabInactiveStyle + 'display:flex;align-items:center;justify-content:center;gap:6px;';
    panelCamera.style.display = 'block';
    panelUpload.style.display = 'none';
  });

  tabUpload.addEventListener('click', () => {
    tabUpload.style.cssText = tabBtnBase + tabActiveStyle + 'display:flex;align-items:center;justify-content:center;gap:6px;';
    tabCamera.style.cssText = tabBtnBase + tabInactiveStyle + 'display:flex;align-items:center;justify-content:center;gap:6px;';
    panelUpload.style.display = 'block';
    panelCamera.style.display = 'none';
    // Stop camera if running
    const reader = window._html5QrcodeScanner;
    if (reader) reader.stop().catch(() => {});
  });

  // Close button
  document.getElementById('close-scanner').addEventListener('click', () => {
    const reader = window._html5QrcodeScanner;
    if (reader) reader.stop().catch(() => {});
    modal.remove();
  });

  // File upload handler
  document.getElementById('qr-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const previewDiv = document.getElementById('upload-preview');
    const previewImg = document.getElementById('upload-img-preview');
    previewDiv.style.display = 'block';
    previewImg.src = URL.createObjectURL(file);

    const resultDiv = document.getElementById('upload-result');
    resultDiv.style.display = 'block';
    resultDiv.style.color = '#aba9bb';
    resultDiv.innerHTML = '<span style="display:flex;align-items:center;gap:8px;">⏳ Đang phân tích mã QR...</span>';

    try {
      if (!window.Html5Qrcode) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const scanner = new Html5Qrcode('qr-reader-hidden', { verbose: false });
      const decodedText = await scanner.scanFile(file, false);
      resultDiv.style.color = '#4ade80';
      resultDiv.innerHTML = `✅ Đọc thành công!<br/><span style="color:#e9e6f9;font-size:12px;word-break:break-all;">${decodedText}</span>`;
      setTimeout(() => {
        modal.remove();
        if (decodedText.includes('restaurant.html')) {
          window.location.href = decodedText;
        } else {
          alert('Nội dung mã QR: ' + decodedText);
        }
      }, 1200);
    } catch (err) {
      resultDiv.style.color = '#ff7351';
      resultDiv.innerHTML = `❌ Không tìm thấy mã QR trong ảnh.<br/><span style="font-size:11px;opacity:0.7;">${err}</span>`;
    }
  });

  // Drag & drop on upload label
  const uploadLabel = document.getElementById('upload-label');
  uploadLabel.addEventListener('dragover', (e) => { e.preventDefault(); uploadLabel.style.borderColor = '#0ea5e9'; });
  uploadLabel.addEventListener('dragleave', () => { uploadLabel.style.borderColor = '#474656'; });
  uploadLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadLabel.style.borderColor = '#474656';
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.getElementById('qr-file-input');
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    }
  });

  // Hidden div for file scanner
  if (!document.getElementById('qr-reader-hidden')) {
    const hidden = document.createElement('div');
    hidden.id = 'qr-reader-hidden';
    hidden.style.display = 'none';
    document.body.appendChild(hidden);
  }

  // Load library then start camera
  if (!window.Html5Qrcode) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    script.onload = () => startScanner();
    document.head.appendChild(script);
  } else {
    startScanner();
  }
}

function startScanner() {
  if (typeof Html5Qrcode === 'undefined') return;
  const html5QrCode = new Html5Qrcode('qr-reader');
  window._html5QrcodeScanner = html5QrCode;
  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      html5QrCode.stop().then(() => {
        document.getElementById('qr-modal')?.remove();
        try {
          if (decodedText.includes('restaurant.html')) {
            window.location.href = decodedText;
          } else {
            alert('Nội dung mã QR: ' + decodedText);
          }
        } catch {
          alert('Mã QR: ' + decodedText);
        }
      });
    },
    () => {}
  ).catch((err) => {
    console.error('Scanner error:', err);
    const readerDiv = document.getElementById('qr-reader');
    if (readerDiv) {
      readerDiv.innerHTML = `<div style="padding:24px;text-align:center;color:#ff7351;font-size:13px;">
        ⚠️ Không thể truy cập camera.<br/><span style="font-size:11px;color:#aba9bb;">Bạn có thể dùng tab <b>Tải ảnh lên</b> để quét từ file.</span>
      </div>`;
    }
  });
}

// ── Dish Loop in Owner Dashboard ──────────────────────────────────────────────
function renderOwnerDishes(dishes, restaurantId) {
  const container = document.querySelector(
    '#dishes-list, .dishes-manage, [class*="dish-list"], [class*="thực-đơn"] ul, [class*="thực-đơn"] > div'
  );
  if (!container) return;

  container.innerHTML = '';

  if (!dishes.length) {
    container.innerHTML = '<p style="color:#aba9bb;padding:16px;text-align:center;">Chưa có món nào. Thêm món đầu tiên!</p>';
  }

  dishes.forEach((dish) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display:flex;align-items:center;gap:12px;padding:14px;
      background:#242437;border-radius:12px;margin-bottom:8px;
    `;
    row.innerHTML = `
      <div style="
        width:52px;height:52px;border-radius:8px;flex-shrink:0;
        background:${dish.image_url ? `url('${dish.image_url}') center/cover` : 'linear-gradient(135deg,#1a1a2e,#181828)'};
        display:flex;align-items:center;justify-content:center;font-size:24px;
      ">${dish.image_url ? '' : '🍽️'}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;color:#e9e6f9;font-size:14px;">${dish.name}</div>
        <div style="color:#0ea5e9;font-size:13px;margin-top:2px;">
          ${dish.price ? Number(dish.price).toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}
        </div>
      </div>
      <label class="switch" style="display:flex;align-items:center;gap:6px;cursor:pointer;min-width:84px;" title="${dish.is_available ? 'Còn món' : 'Hết món'}">
        <input type="checkbox" ${dish.is_available ? 'checked' : ''} data-dish-id="${dish.id}" class="dish-toggle" style="width:16px;height:16px;margin:0;accent-color:#0ea5e9;cursor:pointer;">
        <span class="dish-availability-label" style="font-size:12px;font-weight:600;color:${dish.is_available ? '#67e8f9' : '#aba9bb'};line-height:1;">${dish.is_available ? 'Còn món' : 'Hết món'}</span>
      </label>
      <button data-edit-dish="${dish.id}" style="
        background:none;border:none;color:#aba9bb;cursor:pointer;font-size:18px;
        padding:4px;transition:color 0.2s;
      " title="Sửa">✏️</button>
      <button data-delete-dish="${dish.id}" style="
        background:none;border:none;color:#ff7351;cursor:pointer;font-size:18px;
        padding:4px;transition:color 0.2s;
      " title="Xóa">🗑️</button>
    `;
    container.appendChild(row);

    // Wire edit button
    row.querySelector('[data-edit-dish]').addEventListener('click', () => {
      showDishDialog('edit', dish, restaurantId);
    });
  });

  // Wire availability toggles
  container.querySelectorAll('.dish-toggle').forEach((toggle) => {
    toggle.addEventListener('change', async () => {
      const dishId = toggle.dataset.dishId;
      const label = toggle.nextElementSibling;
      const switchWrap = toggle.closest('.switch');
      try {
        await api.put(`/api/dishes/${dishId}`, { is_available: toggle.checked });
        if (label) {
          label.textContent = toggle.checked ? 'Còn món' : 'Hết món';
          label.style.color = toggle.checked ? '#67e8f9' : '#aba9bb';
        }
        if (switchWrap) {
          switchWrap.title = toggle.checked ? 'Còn món' : 'Hết món';
        }
      } catch (err) {
        alert('Lỗi: ' + err.message);
        toggle.checked = !toggle.checked;
      }
    });
  });

  // Wire delete buttons
  container.querySelectorAll('[data-delete-dish]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Xóa món này?')) return;
      const dishId = btn.dataset.deleteDish;
      const originalText = btn.textContent;
      try {
        btn.disabled = true;
        btn.textContent = '⏳';
        await api.delete(`/api/dishes/${dishId}`);
        btn.closest('div').style.opacity = '0.5';
        setTimeout(() => btn.closest('div').remove(), 300);
      } catch (err) {
        alert('Lỗi xóa món: ' + err.message);
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  });
}

// ── Shared Dish Dialog (Add/Edit) ─────────────────────────────────────────────
function showDishDialog(mode, dish = null, restaurantId) {
  const isEdit = mode === 'edit';
  const existing = document.getElementById('dish-dialog');
  if (existing) existing.remove();

  const dialog = document.createElement('div');
  dialog.id = 'dish-dialog';
  dialog.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9998;
    display:flex;align-items:center;justify-content:center;
  `;
  dialog.innerHTML = `
    <div style="background:#181828;border-radius:16px;padding:24px;width:90%;max-width:400px;box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);">
      <h3 style="color:#0ea5e9;font-family:'Plus Jakarta Sans',sans-serif;margin:0 0 20px;display:flex;align-items:center;gap:8px;">
        ${isEdit ? '✏️ Sửa Món Ăn' : '➕ Thêm Món Mới'}
      </h3>
      <div style="margin-bottom:12px;">
        <label style="display:block;color:#aba9bb;font-size:12px;margin-bottom:4px;margin-left:4px;">Tên món ăn *</label>
        <input id="dish-name" placeholder="Ví dụ: Phở bò" style="${inputStyle}" value="${isEdit ? dish.name : ''}">
      </div>
      <div style="margin-bottom:12px;">
        <label style="display:block;color:#aba9bb;font-size:12px;margin-bottom:4px;margin-left:4px;">Giá (VNĐ)</label>
        <input id="dish-price" type="number" placeholder="Ví dụ: 50000" style="${inputStyle}" value="${isEdit ? dish.price || '' : ''}">
      </div>
      <div style="margin-bottom:20px;">
        <label style="display:block;color:#aba9bb;font-size:12px;margin-bottom:4px;margin-left:4px;">Link ảnh (tùy chọn)</label>
        <input id="dish-image" placeholder="https://..." style="${inputStyle}" value="${isEdit ? dish.image_url || '' : ''}">
      </div>
      <div style="display:flex;gap:12px;">
        <button id="save-dish-btn" style="${btnStyle}">✅ ${isEdit ? 'Lưu Thay Đổi' : 'Lưu Món'}</button>
        <button id="cancel-dish-btn" style="${cancelBtnStyle}">Hủy</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  document.getElementById('cancel-dish-btn').addEventListener('click', () => dialog.remove());
  
  const saveBtn = document.getElementById('save-dish-btn');
  saveBtn.addEventListener('click', async () => {
    if (saveBtn.disabled) return;
    
    const name = document.getElementById('dish-name').value.trim();
    if (!name) { alert('Vui lòng nhập tên món.'); return; }
    const price = parseFloat(document.getElementById('dish-price').value) || null;
    const image_url = document.getElementById('dish-image').value.trim() || null;
    
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Đang lưu...';
      saveBtn.style.opacity = '0.7';

      if (isEdit) {
        await api.put(`/api/dishes/${dish.id}`, { name, price, image_url });
      } else {
        await api.post(`/api/restaurants/${restaurantId}/dishes`, { name, price, image_url });
      }
      
      dialog.remove();
      // Refresh dish list
      const r = await api.get(`/api/restaurants/${restaurantId}`);
      renderOwnerDishes(r.dishes || [], restaurantId);
    } catch (err) {
      alert('Lỗi: ' + err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? '✅ Lưu Thay Đổi' : '✅ Lưu Món';
      saveBtn.style.opacity = '1';
    }
  });
}

function wireAddDish(restaurantId) {
  const addBtn = document.querySelector('#add-dish-btn, [class*="thêm-món"], .add-dish-btn');
  if (!addBtn) return;
  addBtn.addEventListener('click', () => showDishDialog('add', null, restaurantId));
}

const inputStyle = `
  display:block;width:100%;padding:12px 16px;border-radius:8px;border:none;
  background:#242437;color:#e9e6f9;font-family:'Plus Jakarta Sans',sans-serif;
  font-size:14px;margin-bottom:10px;box-sizing:border-box;
`;
const btnStyle = `
  flex:1;padding:12px;border-radius:8px;border:none;cursor:pointer;
  background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#521f00;
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;
`;
const cancelBtnStyle = `
  flex:1;padding:12px;border-radius:8px;border:none;cursor:pointer;
  background:#242437;color:#aba9bb;
  font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:14px;
`;

// ── Owner Reviews Loop ────────────────────────────────────────────────────────
function renderOwnerReviews(reviews) {
  const container = document.querySelector(
    '#owner-reviews, .owner-reviews, [class*="đánh-giá"] .review-list'
  );
  if (!container || !reviews?.length) return;

  container.innerHTML = '';
  reviews.slice(0, 10).forEach((review) => {
    const card = document.createElement('div');
    card.style.cssText = 'background:#1a1a2e;border-radius:8px;padding:12px;margin-bottom:8px;';
    const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.created_at).toLocaleDateString('vi-VN');
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-weight:700;color:#e9e6f9;font-size:13px;">${review.username || 'Khách'}</span>
        <span style="font-size:11px;color:#aba9bb;">${date}</span>
      </div>
      <div style="font-size:13px;margin-bottom:6px;">${stars}</div>
      <p style="color:#e9e6f9;font-size:13px;margin:0;">${review.comment || '—'}</p>
    `;
    container.appendChild(card);
  });
}

// ── Save Restaurant Form ──────────────────────────────────────────────────────
function wireSaveForm(restaurantId) {
  const saveBtn = document.querySelector('#save-restaurant, .save-btn, [class*="lưu-thay-đổi"], [class*="lưu"]');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const getName = (sel) => document.querySelector(sel)?.value?.trim() || null;

    const payload = {
      name: getName('#restaurant-name, [name="name"]'),
      address: getName('#restaurant-address, [name="address"]'),
      description: getName('#restaurant-description, [name="description"]'),
      audio_text: getName('#restaurant-audio, [name="audio_text"]'),
      latitude: parseFloat(document.querySelector('#restaurant-lat, [name="latitude"]')?.value) || null,
      longitude: parseFloat(document.querySelector('#restaurant-lng, [name="longitude"]')?.value) || null,
    };

    // Remove null-only fields
    Object.keys(payload).forEach((k) => payload[k] == null && delete payload[k]);

    try {
      saveBtn.textContent = 'Đang lưu...';
      saveBtn.disabled = true;

      let r;
      if (restaurantId) {
        r = await api.put(`/api/restaurants/${restaurantId}`, payload);
      } else {
        r = await api.post('/api/restaurants', payload);
      }
      currentRestaurant = r;
      displayQR(r);
      alert('✅ Đã lưu thông tin nhà hàng!');
    } catch (err) {
      alert('Lỗi lưu: ' + err.message);
    } finally {
      saveBtn.textContent = 'Lưu thay đổi';
      saveBtn.disabled = false;
    }
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────
function wireLogout() {
  document.querySelectorAll('[class*="logout"], [class*="đăng-xuất"], .logout-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'login.html';
    });
  });
}

// ── Main Init ─────────────────────────────────────────────────────────────────
async function init() {
  if (!checkAuth()) return;

  wireLogout();
  wireAudioPreview();

  try {
    // Fetch owner's restaurant(s)
    const restaurants = await api.get('/api/restaurants/owner/my');
    const restaurant = restaurants[0] || null;
    currentRestaurant = restaurant;

    populateHeader(restaurant);

    if (restaurant) {
      populateAnalytics(restaurant);
      populateForm(restaurant);
      displayQR(restaurant);
      setupQRScanner();
      renderOwnerDishes(restaurant.dishes || [], restaurant.id);
      wireAddDish(restaurant.id);
      wireSaveForm(restaurant.id);

      // Load reviews
      try {
        const reviews = await api.get(`/api/restaurants/${restaurant.id}/reviews`);
        renderOwnerReviews(reviews);
      } catch {}
    } else {
      // No restaurant yet — show creation form
      alert('Bạn chưa có nhà hàng. Hãy tạo nhà hàng đầu tiên!');
      wireSaveForm(null);
    }
  } catch (err) {
    console.error('Owner dashboard init error:', err);
    if (err.message?.includes('401')) {
      clearAuth();
      window.location.href = 'login.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
