/**
 * restaurant.js — Restaurant detail page: dynamic data, TTS, geofencing, QR scan logging, reviews
 * This is the core feature page. It replaces ALL static Stitch data with live API responses.
 */
import { api, getAuth, API_BASE } from './api.js';

// ── State ────────────────────────────────────────────────────────────────────
let restaurant = null;
let ttsUtterance = null;
let isSpeaking = false;
let geofenceWatchId = null;

// Initial language detection
let selectedLang = 'vi-VN';
const browserLang = navigator.language;
if (browserLang) {
  // Map common browser codes to our supported ones if possible
  if (browserLang.startsWith('en')) selectedLang = 'en-US';
  else if (browserLang.startsWith('fr')) selectedLang = 'fr-FR';
  else if (browserLang.startsWith('zh')) selectedLang = 'zh-CN';
  else if (browserLang.startsWith('ja')) selectedLang = 'ja-JP';
  else if (browserLang.startsWith('ko')) selectedLang = 'ko-KR';
  // Keep vi-VN if starts with vi
}

const GEOFENCE_RADIUS_M = 20;
let simulatedDist = null; // null means use real GPS

// ── Haversine Distance (meters) ───────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── TTS ───────────────────────────────────────────────────────────────────────
function startTTS(text) {
  if (!text) { alert('Quán này chưa có nội dung thuyết minh.'); return; }
  if (!window.speechSynthesis) { alert('Trình duyệt không hỗ trợ Text-to-Speech.'); return; }

  stopTTS();

  // On some browsers, we need to resume first
  window.speechSynthesis.resume();

  ttsUtterance = new SpeechSynthesisUtterance(text);
  
  // Find a voice that matches the selectedLang or just use the system default
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === selectedLang) || voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]));
  if (voice) {
    ttsUtterance.voice = voice;
  }
  
  ttsUtterance.lang = selectedLang;
  ttsUtterance.rate = 1.0;
  ttsUtterance.pitch = 1.0;
  ttsUtterance.volume = 1.0;

  let startTimeout = setTimeout(() => {
    if (!isSpeaking) {
      console.warn('[TTS] Failed to start speaking within 2s. Trying second voice fallback...');
      // Fallback is just to let user know or retry without voice setting
    }
  }, 2000);

  ttsUtterance.onstart = () => {
    clearTimeout(startTimeout);
    isSpeaking = true;
    updatePlayButton(true);
    updateStatus('🎧 Đang phát thuyết minh...');
    startGeofence();
  };
  ttsUtterance.onend = () => {
    isSpeaking = false;
    updatePlayButton(false);
    updateStatus('Nhấn để nghe thuyết minh...');
    stopGeofence();
  };
  ttsUtterance.onerror = (e) => {
    clearTimeout(startTimeout);
    console.error('[TTS] Error:', e);
    isSpeaking = false;
    updatePlayButton(false);
    updateStatus('Lỗi phát âm: ' + (e.error || 'Unknown'));
    stopGeofence();
  };

  window.speechSynthesis.speak(ttsUtterance);
}


function stopTTS() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  updatePlayButton(false);
  updateStatus('Nhấn để nghe thuyết minh...');
  stopGeofence();
}

function updatePlayButton(playing) {
  const btn = document.getElementById('play-btn');
  if (btn) {
    btn.innerHTML = playing ? '⏸' : '▶';
    btn.style.boxShadow = playing
      ? '0 0 24px rgba(14,165,233,0.7)'
      : '0 0 16px rgba(14,165,233,0.3)';
  }
}

function updateStatus(msg) {
  const el = document.getElementById('tts-status');
  if (el) el.textContent = msg;
}

// ── Geofencing ────────────────────────────────────────────────────────────────
function startGeofence() {
  if (!restaurant?.latitude || !restaurant?.longitude) return;

  // Real GPS setup
  if (navigator.geolocation && simulatedDist === null) {
    geofenceWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (simulatedDist !== null) return; // Ignore if simulating
        const dist = haversineDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          parseFloat(restaurant.latitude),
          parseFloat(restaurant.longitude)
        );
        handleGeofenceUpdate(dist);
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }
}

function handleGeofenceUpdate(dist) {
  updateGeofenceBadge(dist);
  if (dist > GEOFENCE_RADIUS_M && isSpeaking) {
    stopTTS();
    showGeofenceAlert(dist);
  }
}

window.simulateGeofence = function(dist) {
  simulatedDist = dist;
  handleGeofenceUpdate(dist);
  if (simulatedDist !== null) {
    document.querySelector('#geofence-badge').style.boxShadow = '0 0 10px #0ea5e9';
  }
}
window.clearSimulation = function() {
  simulatedDist = null;
  document.querySelector('#geofence-badge').style.boxShadow = '';
  document.querySelector('#geofence-badge').textContent = '📍 Đang dùng GPS gốc...';
}

function stopGeofence() {
  if (geofenceWatchId !== null) {
    navigator.geolocation.clearWatch(geofenceWatchId);
    geofenceWatchId = null;
  }
}

function updateGeofenceBadge(dist) {
  const badge = document.getElementById('geofence-badge');
  if (!badge) return;
  const inRange = dist <= GEOFENCE_RADIUS_M;
  badge.textContent = inRange
    ? `📍 Trong phạm vi (${Math.round(dist)}m)`
    : `⚠️ Ngoài phạm vi (${Math.round(dist)}m)`;
  badge.style.background = inRange ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';
  badge.style.color = inRange ? '#4ade80' : '#f87171';
}

function showGeofenceAlert(dist) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);
    background:#b92902;color:#fff;padding:14px 24px;border-radius:12px;
    z-index:9999;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,0.4);
    animation:slideDown 0.3s ease;
  `;
  toast.textContent = `⚠️ Đã ra khỏi khu vực quán (${Math.round(dist)}m). Thuyết minh đã dừng.`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Dish Loop Renderer ─────────────────────────────────────────────────────────
function renderDishes(dishes) {
  const container = document.getElementById('dishes-container');
  if (!container) return;

  if (!dishes || dishes.length === 0) {
    container.innerHTML = '<p style="color:#aba9bb;text-align:center;padding:16px;">Chưa có món ăn</p>';
    return;
  }

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;';

  dishes.forEach((dish) => {
    const card = document.createElement('div');
    card.style.cssText = `
      flex-shrink:0;width:140px;background:#242437;border-radius:12px;overflow:hidden;
      transition:transform 0.2s;cursor:default;
    `;
    card.innerHTML = `
      <div style="
        height:100px;background:linear-gradient(135deg,#1a1a2e,#242437);
        display:flex;align-items:center;justify-content:center;font-size:40px;
        ${dish.image_url ? `background-image:url('${dish.image_url}');background-size:cover;background-position:center;` : ''}
      ">${dish.image_url ? '' : '🍽️'}</div>
      <div style="padding:10px;">
        <div style="font-weight:700;color:#e9e6f9;font-size:13px;line-height:1.3;">${dish.name}</div>
        <div style="color:#0ea5e9;font-weight:700;font-size:14px;margin-top:4px;">
          ${dish.price ? Number(dish.price).toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}
        </div>
        <div style="margin-top:6px;">
          <span style="
            font-size:10px;padding:2px 8px;border-radius:20px;
            background:${dish.is_available ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};
            color:${dish.is_available ? '#4ade80' : '#f87171'};
          ">${dish.is_available ? 'Còn món' : 'Hết món'}</span>
        </div>
      </div>
    `;
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    wrapper.appendChild(card);
  });

  container.appendChild(wrapper);
}

// ── Reviews Loop Renderer ──────────────────────────────────────────────────────
function renderReviews(reviews, avgRating) {
  // Update avg rating display
  document.querySelectorAll('#avg-rating').forEach(el => {
    el.textContent = avgRating ? avgRating.toFixed(1) : '—';
  });

  const container = document.getElementById('reviews-container');
  if (!container) return;

  container.innerHTML = '';

  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<p style="color:#aba9bb;text-align:center;padding:16px;">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>';
    return;
  }

  reviews.forEach((review) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background:#242437;border-radius:12px;padding:16px;margin-bottom:10px;
    `;
    const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.created_at).toLocaleDateString('vi-VN');
    const initial = (review.username || 'K')[0].toUpperCase();

    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="
          width:40px;height:40px;background:linear-gradient(135deg,#0ea5e9,#0284c7);
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-weight:700;color:#521f00;font-size:16px;flex-shrink:0;
        ">${initial}</div>
        <div>
          <div style="font-weight:700;color:#e9e6f9;font-size:14px;">${review.username || 'Khách vãng lai'}</div>
          <div style="font-size:12px;color:#aba9bb;">${date}</div>
        </div>
        <div style="margin-left:auto;font-size:13px;">${stars}</div>
      </div>
      ${review.comment ? `<p style="color:#e9e6f9;font-size:14px;line-height:1.6;margin:0;">${review.comment}</p>` : ''}
    `;
    container.appendChild(card);
  });
}

// ── Review Form ───────────────────────────────────────────────────────────────
async function submitReview(restaurantId) {
  const { token } = getAuth();
  if (!token) {
    alert('Vui lòng đăng nhập để đánh giá.');
    window.location.href = 'login.html';
    return;
  }

  const rating = parseInt(document.querySelector('#review-rating, [name="rating"]')?.value || '5');
  const comment = document.querySelector('#review-comment, [name="comment"], textarea')?.value;

  try {
    await api.post(`/api/restaurants/${restaurantId}/reviews`, { rating, comment });
    // Refresh reviews
    const reviews = await api.get(`/api/restaurants/${restaurantId}/reviews`);
    renderReviews(reviews, restaurant.avg_rating);

    // Reset form
    const textarea = document.querySelector('#review-comment, textarea');
    if (textarea) textarea.value = '';
    alert('✅ Đánh giá của bạn đã được gửi!');
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}

// ── Star Rating Picker ────────────────────────────────────────────────────────
function setupStarPicker() {
  const starsContainer = document.querySelector('.star-picker, #star-picker, [class*="star-select"]');
  if (!starsContainer) {
    // Create one inline
    const reviewForm = document.querySelector('.review-form, #review-form');
    if (!reviewForm) return;
    const picker = document.createElement('div');
    picker.id = 'star-picker';
    picker.style.cssText = 'display:flex;gap:8px;margin:12px 0;';
    picker.innerHTML = [1, 2, 3, 4, 5].map((n) => `
      <span data-star="${n}" style="font-size:28px;cursor:pointer;transition:transform 0.15s;">☆</span>
    `).join('');
    reviewForm.prepend(picker);

    let selectedStar = 5;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.id = 'review-rating';
    picker.appendChild(input);

    picker.querySelectorAll('[data-star]').forEach((star) => {
      star.addEventListener('click', () => {
        selectedStar = parseInt(star.dataset.star);
        input.value = selectedStar;
        picker.querySelectorAll('[data-star]').forEach((s) => {
          s.textContent = parseInt(s.dataset.star) <= selectedStar ? '⭐' : '☆';
        });
      });
      star.addEventListener('mouseenter', () => {
        star.style.transform = 'scale(1.2)';
      });
      star.addEventListener('mouseleave', () => {
        star.style.transform = '';
      });
    });
    input.value = 5;
  }
}

// ── Language Selector ─────────────────────────────────────────────────────────
function buildLanguageSelector() {
  const langContainer = document.querySelector('#lang-selector, .lang-pills');
  if (!langContainer) return;

  function populateVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    // Filter unique language codes (e.g., 'en-US', 'vi-VN')
    const uniqueLangs = new Map();
    voices.forEach(v => {
      if (!uniqueLangs.has(v.lang)) {
        uniqueLangs.set(v.lang, v.name);
      }
    });

    langContainer.innerHTML = '';
    langContainer.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;';

    // Prioritize commonly used languages, sort the rest
    const codePriority = ['vi-VN', 'en-US', 'fr-FR', 'zh-CN', 'ja-JP', 'ko-KR'];
    const sortedLangs = Array.from(uniqueLangs.keys()).sort((a, b) => {
      const idxA = codePriority.indexOf(a);
      const idxB = codePriority.indexOf(b);
      if (idxA > -1 && idxB > -1) return idxA - idxB;
      if (idxA > -1) return -1;
      if (idxB > -1) return 1;
      return a.localeCompare(b);
    });

    sortedLangs.forEach((code, i) => {
      // Basic country flag fallback
      const flagMap = {
        'vi-VN': '🇻🇳', 'en-US': '🇺🇸', 'en-GB': '🇬🇧', 'fr-FR': '🇫🇷',
        'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼', 'ja-JP': '🇯🇵', 'ko-KR': '🇰🇷',
        'de-DE': '🇩🇪', 'es-ES': '🇪🇸', 'it-IT': '🇮🇹', 'th-TH': '🇹🇭',
        'id-ID': '🇮🇩', 'ru-RU': '🇷🇺', 'pt-BR': '🇧🇷', 'pt-PT': '🇵🇹',
        'nl-NL': '🇳🇱', 'pl-PL': '🇵🇱', 'tr-TR': '🇹🇷', 'ar-SA': '🇸🇦',
        'hi-IN': '🇮🇳', 'ms-MY': '🇲🇾', 'km-KH': '🇰🇭', 'lo-LA': '🇱🇦'
      };
      
      const parts = code.split('-');
      const dispLabel = flagMap[code] ? `${flagMap[code]} ${parts[0].toUpperCase()}` : `🌐 ${parts[0].toUpperCase()}`;

      const pill = document.createElement('button');
      pill.dataset.lang = code;
      pill.textContent = dispLabel;
      pill.title = uniqueLangs.get(code); // show native voice name on hover
      pill.style.cssText = `
        padding:8px 14px;border-radius:20px;border:none;cursor:pointer;
        font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;
        background:#242437;color:#aba9bb;transition:all 0.2s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      `;

      if (code === selectedLang || (i === 0 && !uniqueLangs.has(selectedLang))) {
        selectedLang = code;
        pill.style.background = 'linear-gradient(135deg,#0ea5e9,#0284c7)';
        pill.style.color = '#521f00';
        pill.classList.add('active');
      }

      pill.addEventListener('click', async () => {
        if (pill.classList.contains('active')) return;
        
        langContainer.querySelectorAll('button').forEach((p) => {
          p.style.background = '#242437';
          p.style.color = '#aba9bb';
          p.classList.remove('active');
        });
        pill.style.background = 'linear-gradient(135deg,#0ea5e9,#0284c7)';
        pill.style.color = '#521f00';
        pill.classList.add('active');
        selectedLang = code;
        
        // Trigger re-fetch for translation
        const urlParams = new URLSearchParams(window.location.search);
        const rid = urlParams.get('id');
        if (rid) {
          updateStatus('🔄 Đang dịch nội dung...');
          await loadRestaurantData(rid, code);
        }
      });

      langContainer.appendChild(pill);
    });
  }

  // Load voices immediately if available, otherwise listen for the event
  if (window.speechSynthesis.getVoices().length > 0) {
    populateVoices();
  } else {
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }
}

// ── Populate Page ─────────────────────────────────────────────────────────────
function populatePage(r) {
  document.title = `${r.name} — Phố Vĩnh Khánh`;

  // Name
  const nameEl = document.getElementById('restaurant-name');
  if (nameEl) nameEl.textContent = r.name;

  // Address
  const addrEl = document.querySelector('.restaurant-address');
  if (addrEl) addrEl.textContent = r.address || 'Phố Vĩnh Khánh, Q.4';

  // Description
  const descEl = document.querySelector('.restaurant-description');
  if (descEl) descEl.textContent = r.description || 'Chưa có mô tả cho nhà hàng này.';

  // Audio text status
  const statusEl = document.getElementById('tts-status');
  if (statusEl) {
    statusEl.textContent = r.audio_text ? 'Nhấn để nghe thuyết minh...' : '⚠️ Quán này chưa có nội dung thuyết minh';
  }

  // Geofence badge
  const badge = document.querySelector('#geofence-badge, .geofence-badge');
  if (badge) {
    if (r.latitude && r.longitude) {
      badge.textContent = '📍 Đang xác định vị trí...';
    } else {
      badge.textContent = '📍 Không có dữ liệu GPS';
    }
  }
}

// ── Wire Back Button ──────────────────────────────────────────────────────────
function wireBackButton() {
  const btn = document.getElementById('back-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = 'map.html';
    });
  }
}

// ── Wire Play Button ──────────────────────────────────────────────────────────
function wirePlayButton() {
  const btn = document.getElementById('play-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSpeaking) {
        stopTTS();
      } else {
        startTTS(restaurant?.audio_text || '');
      }
    });
  }
}

// ── Wire Review Submit ────────────────────────────────────────────────────────
function wireReviewForm(restaurantId) {
  const { token } = getAuth();
  let submitBtn = document.getElementById('review-submit');

  // Wire the "Viết đánh giá" button to toggle review form
  const toggleBtn = document.getElementById('write-review-btn');
  const reviewFormEl = document.getElementById('review-form');

  if (toggleBtn && reviewFormEl) {
    reviewFormEl.style.display = 'none';
    toggleBtn.addEventListener('click', () => {
      reviewFormEl.style.display = reviewFormEl.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Wire submit button
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitReview(restaurantId);
    });
  }
}

// ── Main Init ─────────────────────────────────────────────────────────────────
async function loadRestaurantData(id, lang = null) {
  try {
    console.log(`[Restaurant] Fetching details (lang=${lang})...`);
    const query = lang ? `?lang=${lang}` : '';
    const data = await api.get(`/api/restaurants/${id}${query}`);
    restaurant = data;
    console.log('[Restaurant] Details loaded:', restaurant);
    
    // Update UI
    populatePage(restaurant);
    return restaurant;
  } catch (err) {
    console.error('[Restaurant] Fetch failed:', err);
    if (!restaurant) {
      document.body.innerHTML = `<div style="color:#ff7351;text-align:center;padding:40px;font-family:sans-serif;">Không tìm thấy nhà hàng. <a href="map.html" style="color:#0ea5e9;">Quay lại bản đồ</a></div>`;
    } else {
      updateStatus('⚠️ Lỗi khi dịch nội dung. Đang dùng bản gốc.');
    }
  }
}

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');
  console.log('[Restaurant] Init with ID:', restaurantId);

  if (!restaurantId) {
    console.error('[Restaurant] No ID found in URL');
    document.body.innerHTML = '<div style="color:#ff7351;text-align:center;padding:40px;font-family:sans-serif;">Không tìm thấy ID nhà hàng. <a href="map.html" style="color:#0ea5e9;">Quay lại bản đồ</a></div>';
    return;
  }

  // Log scan (non-blocking)
  const { token } = getAuth();
  console.log('[Restaurant] Logging scan...');
  fetch(`${API_BASE}/api/restaurants/${restaurantId}/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).catch((e) => console.warn('[Restaurant] Scan log failed:', e));

  // Initial fetch with detected language
  if (selectedLang !== 'vi-VN') {
    updateStatus('🔄 Đang dịch nội dung sang ngôn ngữ của bạn...');
  }
  await loadRestaurantData(restaurantId, selectedLang === 'vi-VN' ? null : selectedLang);


  populatePage(restaurant);
  renderDishes(restaurant.dishes || []);

  // Fetch and render reviews
  try {
    const reviews = await api.get(`/api/restaurants/${restaurantId}/reviews`);
    renderReviews(reviews, restaurant.avg_rating);
  } catch (err) {
    console.warn('Could not load reviews:', err);
  }

  buildLanguageSelector();
  wirePlayButton();
  wireBackButton();
  wireReviewForm(restaurantId);
  setupStarPicker();
}

document.addEventListener('DOMContentLoaded', init);

// Cleanup on page leave
window.addEventListener('beforeunload', () => {
  stopTTS();
  stopGeofence();
});
