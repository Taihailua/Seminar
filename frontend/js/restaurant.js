/**
 * restaurant.js — Restaurant detail page: dynamic data, TTS, geofencing, QR scan logging, reviews
 * This is the core feature page. It replaces ALL static Stitch data with live API responses.
 */
import { api, getAuth } from './api.js';

// ── State ────────────────────────────────────────────────────────────────────
let restaurant = null;
let ttsUtterance = null;
let isSpeaking = false;
let geofenceWatchId = null;
let selectedLang = 'vi-VN';
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

  ttsUtterance = new SpeechSynthesisUtterance(text);
  ttsUtterance.lang = selectedLang;
  ttsUtterance.rate = 0.95;
  ttsUtterance.pitch = 1.0;
  ttsUtterance.volume = 1.0;

  ttsUtterance.onstart = () => {
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
    isSpeaking = false;
    updatePlayButton(false);
    updateStatus('Lỗi phát âm: ' + e.error);
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
  const playBtns = document.querySelectorAll('#play-btn, .play-btn, [class*="play-button"], .audio-play');
  playBtns.forEach((btn) => {
    btn.innerHTML = playing
      ? '⏸'
      : '▶';
    btn.style.boxShadow = playing
      ? '0 0 24px rgba(242,108,13,0.7)'
      : '0 0 16px rgba(242,108,13,0.3)';
  });
}

function updateStatus(msg) {
  const statusEls = document.querySelectorAll('#tts-status, .tts-status, [class*="audio-status"]');
  statusEls.forEach((el) => (el.textContent = msg));
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
    document.querySelector('#geofence-badge').style.boxShadow = '0 0 10px #ff9155';
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
  const badge = document.querySelector('#geofence-badge, .geofence-badge, [class*="in-range"]');
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
  const container = document.querySelector(
    '#dishes-container, .dishes-list, .menu-container, [class*="thực-đơn"], [class*="dish"]'
  );
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
        <div style="color:#ff9155;font-weight:700;font-size:14px;margin-top:4px;">
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
  const avgEls = document.querySelectorAll('.avg-rating, #avg-rating, [class*="rating-number"]');
  avgEls.forEach((el) => {
    el.textContent = avgRating ? avgRating.toFixed(1) : '—';
  });

  const container = document.querySelector(
    '#reviews-container, .reviews-list, [class*="đánh-giá"], [class*="review"]'
  );
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
          width:40px;height:40px;background:linear-gradient(135deg,#ff9155,#ff7a27);
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
        'zh-CN': '🇨🇳', 'ja-JP': '🇯🇵', 'ko-KR': '🇰🇷', 'de-DE': '🇩🇪',
        'es-ES': '🇪🇸', 'it-IT': '🇮🇹', 'th-TH': '🇹🇭', 'id-ID': '🇮🇩'
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
        pill.style.background = 'linear-gradient(135deg,#ff9155,#ff7a27)';
        pill.style.color = '#521f00';
        pill.classList.add('active');
      }

      pill.addEventListener('click', () => {
        langContainer.querySelectorAll('button').forEach((p) => {
          p.style.background = '#242437';
          p.style.color = '#aba9bb';
          p.classList.remove('active');
        });
        pill.style.background = 'linear-gradient(135deg,#ff9155,#ff7a27)';
        pill.style.color = '#521f00';
        pill.classList.add('active');
        selectedLang = code;
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
  document.querySelectorAll('.restaurant-name, .hero-title, h1, [class*="name"]').forEach((el) => {
    if (el.textContent.includes('Minh Tâm') || el.classList.contains('restaurant-name') || el.tagName === 'H1') {
      el.textContent = r.name;
    }
  });

  // Address
  document.querySelectorAll('.restaurant-address, .address, [class*="address"]').forEach((el) => {
    el.textContent = r.address || 'Phố Vĩnh Khánh, Q.4';
  });

  // Description
  document.querySelectorAll('.restaurant-description, .description, [class*="description"]').forEach((el) => {
    el.textContent = r.description || 'Chưa có mô tả cho nhà hàng này.';
  });

  // Audio text status
  document.querySelectorAll('#tts-status, .tts-status, [class*="audio-status"]').forEach((el) => {
    el.textContent = r.audio_text ? 'Nhấn để nghe thuyết minh...' : '⚠️ Quán này chưa có nội dung thuyết minh';
  });

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
  document.querySelectorAll('[class*="back"], .btn-back, [class*="quay-lại"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = 'map.html';
    });
  });
}

// ── Wire Play Button ──────────────────────────────────────────────────────────
function wirePlayButton() {
  const playBtns = document.querySelectorAll('#play-btn, .play-btn, [class*="play-button"], .audio-play-btn');
  playBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (isSpeaking) {
        stopTTS();
      } else {
        startTTS(restaurant?.audio_text || '');
      }
    });
  });

  // If no play button found, create one near the audio section
  if (!playBtns.length) {
    const audioSection = document.querySelector('[class*="audio"], .audio-section');
    if (audioSection) {
      const playBtn = document.createElement('button');
      playBtn.id = 'play-btn';
      playBtn.textContent = '▶';
      playBtn.style.cssText = `
        width:72px;height:72px;border-radius:50%;border:none;cursor:pointer;
        background:linear-gradient(135deg,#ff9155,#ff7a27);
        font-size:28px;color:#521f00;
        box-shadow:0 0 16px rgba(242,108,13,0.3);
        transition:all 0.2s;display:block;margin:16px auto;
      `;
      playBtn.addEventListener('click', () => {
        if (isSpeaking) stopTTS(); else startTTS(restaurant?.audio_text || '');
      });
      audioSection.appendChild(playBtn);
    }
  }
}

// ── Wire Review Submit ────────────────────────────────────────────────────────
function wireReviewForm(restaurantId) {
  const { token } = getAuth();

  let submitBtn = document.querySelector('#review-submit, .review-submit, [class*="gửi-đánh-giá"], [class*="viết-đánh-giá"]');

  // Wire the "Viết đánh giá" button to toggle review form
  const toggleBtn = document.querySelector('[class*="viết"], .write-review-btn');
  const reviewFormEl = document.querySelector('.review-form, #review-form');

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
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const restaurantId = urlParams.get('id');

  if (!restaurantId) {
    document.body.innerHTML = '<div style="color:#ff7351;text-align:center;padding:40px;font-family:sans-serif;">Không tìm thấy ID nhà hàng. <a href="map.html" style="color:#ff9155;">Quay lại bản đồ</a></div>';
    return;
  }

  // Log scan (non-blocking)
  const { token } = getAuth();
  fetch(`http://localhost:8000/api/restaurants/${restaurantId}/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).catch(() => {});

  try {
    restaurant = await api.get(`/api/restaurants/${restaurantId}`);
  } catch (err) {
    document.body.innerHTML = `<div style="color:#ff7351;text-align:center;padding:40px;font-family:sans-serif;">Không tìm thấy nhà hàng. <a href="map.html" style="color:#ff9155;">Quay lại bản đồ</a></div>`;
    return;
  }

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
