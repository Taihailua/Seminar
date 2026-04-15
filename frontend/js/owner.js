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
  
  const setVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.replace('_', '-') === 'vi-VN' || v.lang.startsWith('vi'));
    if (voice) {
      ttsUtterance.voice = voice;
    }
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
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    setVoiceAndSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      setVoiceAndSpeak();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
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
    img.className = 'w-full h-full object-contain rounded-xl';
    const placeholder2 = qrContainer.querySelector('[class*="placeholder"], [class*="qr-placeholder"]');
    if (placeholder2) placeholder2.replaceWith(img);
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
  // Responsive modal container — covers full screen, centered content
  modal.className = 'fixed inset-0 bg-black/85 z-[9999] flex flex-col items-center justify-center p-4';

  modal.innerHTML = `
    <div class="bg-[#181828] rounded-2xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md border border-[#242437] shadow-2xl overflow-y-auto max-h-[90dvh]">
      <div class="flex justify-between items-center mb-5">
        <h3 class="text-[#0ea5e9] font-bold text-base flex items-center gap-2 font-['Plus_Jakarta_Sans']">
          <span class="material-symbols-outlined notranslate text-[20px]">qr_code_scanner</span> Quét Mã QR
        </h3>
        <button id="close-scanner" class="w-8 h-8 bg-white/5 border-none text-[#aba9bb] text-lg cursor-pointer rounded-lg flex items-center justify-center hover:text-white transition-colors">✕</button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-5">
        <button id="tab-camera" class="flex-1 py-2.5 border-none cursor-pointer text-xs sm:text-sm font-bold font-['Plus_Jakarta_Sans'] transition-all rounded-lg flex items-center justify-center gap-1.5 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white">
          <span class="material-symbols-outlined notranslate text-sm">photo_camera</span> Camera
        </button>
        <button id="tab-upload" class="flex-1 py-2.5 border-none cursor-pointer text-xs sm:text-sm font-bold font-['Plus_Jakarta_Sans'] transition-all rounded-lg flex items-center justify-center gap-1.5 bg-[#242437] text-[#aba9bb]">
          <span class="material-symbols-outlined notranslate text-sm">upload_file</span> Tải ảnh lên
        </button>
      </div>

      <!-- Camera Panel -->
      <div id="panel-camera">
        <div id="qr-reader" class="rounded-xl overflow-hidden bg-black min-h-[220px] sm:min-h-[250px]"></div>
        <p class="text-[#aba9bb] text-xs text-center mt-3">Hướng camera vào mã QR để quét tự động</p>
      </div>

      <!-- Upload Panel -->
      <div id="panel-upload" class="hidden">
        <label id="upload-label" for="qr-file-input" class="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#474656] rounded-xl p-6 sm:p-8 cursor-pointer transition-colors min-h-[180px] sm:min-h-[200px] hover:border-[#0ea5e9]">
          <span class="material-symbols-outlined notranslate text-5xl text-[#0ea5e9] opacity-80">add_photo_alternate</span>
          <span class="text-[#aba9bb] text-xs sm:text-sm font-['Plus_Jakarta_Sans'] text-center">
            Bấm để chọn ảnh QR<br/><span class="text-[11px] opacity-60">Hỗ trợ JPG, PNG, WEBP</span>
          </span>
        </label>
        <input id="qr-file-input" type="file" accept="image/*" class="hidden" />
        <div id="upload-preview" class="hidden mt-3 text-center">
          <img id="upload-img-preview" class="max-w-full max-h-48 rounded-xl mb-2 mx-auto" />
        </div>
        <div id="upload-result" class="hidden mt-3 p-3 rounded-xl bg-[#242437]"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Tab style helpers
  const activeTabCls = 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-white';
  const inactiveTabCls = 'bg-[#242437] text-[#aba9bb]';

  // Tab switching
  const tabCamera = document.getElementById('tab-camera');
  const tabUpload = document.getElementById('tab-upload');
  const panelCamera = document.getElementById('panel-camera');
  const panelUpload = document.getElementById('panel-upload');

  tabCamera.addEventListener('click', () => {
    tabCamera.className = `flex-1 py-2.5 border-none cursor-pointer text-xs sm:text-sm font-bold font-['Plus_Jakarta_Sans'] transition-all rounded-lg flex items-center justify-center gap-1.5 ${activeTabCls}`;
    tabUpload.className = `flex-1 py-2.5 border-none cursor-pointer text-xs sm:text-sm font-bold font-['Plus_Jakarta_Sans'] transition-all rounded-lg flex items-center justify-center gap-1.5 ${inactiveTabCls}`;
    panelCamera.classList.remove('hidden');
    panelUpload.classList.add('hidden');
  });

  tabUpload.addEventListener('click', () => {
    tabUpload.className = `flex-1 py-2.5 border-none cursor-pointer text-xs sm:text-sm font-bold font-['Plus_Jakarta_Sans'] transition-all rounded-lg flex items-center justify-center gap-1.5 ${activeTabCls}`;
    tabCamera.className = `flex-1 py-2.5 border-none cursor-pointer text-xs sm:text-sm font-bold font-['Plus_Jakarta_Sans'] transition-all rounded-lg flex items-center justify-center gap-1.5 ${inactiveTabCls}`;
    panelUpload.classList.remove('hidden');
    panelCamera.classList.add('hidden');
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
    previewDiv.classList.remove('hidden');
    previewImg.src = URL.createObjectURL(file);

    const resultDiv = document.getElementById('upload-result');
    resultDiv.classList.remove('hidden');
    resultDiv.style.color = '#aba9bb';
    resultDiv.innerHTML = '<span class="flex items-center gap-2 text-sm">⏳ Đang phân tích mã QR...</span>';

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
  uploadLabel.addEventListener('dragover', (e) => { e.preventDefault(); uploadLabel.classList.add('border-[#0ea5e9]'); });
  uploadLabel.addEventListener('dragleave', () => { uploadLabel.classList.remove('border-[#0ea5e9]'); });
  uploadLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadLabel.classList.remove('border-[#0ea5e9]');
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
    { fps: 10, qrbox: { width: 220, height: 220 } },
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
      readerDiv.innerHTML = `<div class="p-6 text-center text-[#ff7351] text-sm">⚠️ Không thể truy cập camera.<br/><span class="text-xs text-[#aba9bb]">Bạn có thể dùng tab <b>Tải ảnh lên</b> để quét từ file.</span></div>`;
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
    container.innerHTML = '<p class="text-[#aba9bb] text-center p-4 text-sm">Chưa có món nào. Thêm món đầu tiên!</p>';
  }

  dishes.forEach((dish) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3 p-3 sm:p-3.5 bg-[#242437] rounded-xl transition-opacity';

    row.innerHTML = `
      <div class="w-12 h-12 sm:w-13 sm:h-13 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden"
        style="background:${dish.image_url ? `url('${dish.image_url}') center/cover` : 'linear-gradient(135deg,#1a1a2e,#181828)'};">
        ${dish.image_url ? '' : '🍽️'}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-[#e9e6f9] text-sm truncate">${dish.name}</div>
        <div class="text-[#0ea5e9] text-xs mt-0.5">
          ${dish.price ? Number(dish.price).toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}
        </div>
      </div>
      <label class="switch cursor-pointer flex-shrink-0" title="${dish.is_available ? 'Còn món' : 'Hết món'}">
        <input type="checkbox" ${dish.is_available ? 'checked' : ''} data-dish-id="${dish.id}" class="dish-toggle sr-only">
        <span class="block w-10 h-5 sm:w-11 sm:h-6 rounded-full relative transition-colors duration-300"
          style="background:${dish.is_available ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : '#474656'};">
        </span>
      </label>
      <button data-edit-dish="${dish.id}" class="text-[#aba9bb] hover:text-white text-lg sm:text-xl p-1 transition-colors flex-shrink-0" title="Sửa">✏️</button>
      <button data-delete-dish="${dish.id}" class="text-[#ff7351] hover:text-red-400 text-lg sm:text-xl p-1 transition-colors flex-shrink-0" title="Xóa">🗑️</button>
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
      const span = toggle.nextElementSibling;
      try {
        await api.put(`/api/dishes/${dishId}`, { is_available: toggle.checked });
        if (span) span.style.background = toggle.checked ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : '#474656';
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
  // Responsive modal overlay
  dialog.className = 'fixed inset-0 bg-black/70 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4';
  dialog.innerHTML = `
    <div class="bg-[#181828] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-sm md:max-w-md shadow-2xl border border-[#242437]/50">
      <h3 class="text-[#0ea5e9] font-bold text-base mb-5 flex items-center gap-2 font-['Plus_Jakarta_Sans']">
        ${isEdit ? '✏️ Sửa Món Ăn' : '➕ Thêm Món Mới'}
      </h3>
      <div class="space-y-3">
        <div>
          <label class="block text-[#aba9bb] text-xs mb-1 ml-1">Tên món ăn *</label>
          <input id="dish-name" placeholder="Ví dụ: Phở bò" value="${isEdit ? dish.name : ''}"
            class="w-full px-4 py-3 rounded-xl border-none bg-[#242437] text-[#e9e6f9] font-['Plus_Jakarta_Sans'] text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40" />
        </div>
        <div>
          <label class="block text-[#aba9bb] text-xs mb-1 ml-1">Giá (VNĐ)</label>
          <input id="dish-price" type="number" placeholder="Ví dụ: 50000" value="${isEdit ? dish.price || '' : ''}"
            class="w-full px-4 py-3 rounded-xl border-none bg-[#242437] text-[#e9e6f9] font-['Plus_Jakarta_Sans'] text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40" />
        </div>
        <div>
          <label class="block text-[#aba9bb] text-xs mb-1 ml-1">Link ảnh (tùy chọn)</label>
          <input id="dish-image" placeholder="https://..." value="${isEdit ? dish.image_url || '' : ''}"
            class="w-full px-4 py-3 rounded-xl border-none bg-[#242437] text-[#e9e6f9] font-['Plus_Jakarta_Sans'] text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40" />
        </div>
      </div>
      <div class="flex gap-3 mt-5">
        <button id="save-dish-btn"
          class="flex-1 py-3 rounded-xl border-none cursor-pointer bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] text-[#521f00] font-bold text-sm font-['Plus_Jakarta_Sans'] transition-opacity active:scale-[0.98]">
          ✅ ${isEdit ? 'Lưu Thay Đổi' : 'Lưu Món'}
        </button>
        <button id="cancel-dish-btn"
          class="flex-1 py-3 rounded-xl border-none cursor-pointer bg-[#242437] text-[#aba9bb] font-semibold text-sm font-['Plus_Jakarta_Sans'] hover:bg-[#2a2a45] transition-colors">
          Hủy
        </button>
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

// ── Owner Reviews Loop ────────────────────────────────────────────────────────
function renderOwnerReviews(reviews) {
  const container = document.querySelector(
    '#owner-reviews, .owner-reviews, [class*="đánh-giá"] .review-list'
  );
  if (!container || !reviews?.length) return;

  container.innerHTML = '';
  reviews.slice(0, 10).forEach((review) => {
    const card = document.createElement('div');
    card.className = 'bg-[#1a1a2e] rounded-xl p-3 sm:p-4';
    const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.created_at).toLocaleDateString('vi-VN');
    card.innerHTML = `
      <div class="flex justify-between items-start mb-2 gap-2">
        <span class="font-bold text-[#e9e6f9] text-sm">${review.username || 'Khách'}</span>
        <span class="text-[11px] text-[#aba9bb] flex-shrink-0">${date}</span>
      </div>
      <div class="text-sm mb-1.5">${stars}</div>
      <p class="text-[#e9e6f9] text-sm m-0 leading-relaxed">${review.comment || '—'}</p>
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
