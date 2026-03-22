/**
 * owner.js — Owner dashboard: CRUD, dish management, QR display, analytics, reviews
 * Replaces all static Stitch data with live API calls.
 */
import { api, getAuth, clearAuth, requireAuth } from './api.js';

let currentRestaurant = null;

// ── Auth Guard ────────────────────────────────────────────────────────────────
function checkAuth() {
  const { token, role } = getAuth();
  if (!token) { window.location.href = '/pages/login.html'; return false; }
  if (role !== 'owner' && role !== 'admin') {
    window.location.href = '/pages/map.html';
    return false;
  }
  return true;
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
  });

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
  const downloadBtn = document.querySelector('#download-qr, .download-qr, [class*="tải-qr"], [class*="download-qr"]');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = restaurant.qr_code_url;
      link.download = `qr-${restaurant.name}.png`;
      link.click();
    });
  }
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
        <div style="color:#ff9155;font-size:13px;margin-top:2px;">
          ${dish.price ? Number(dish.price).toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}
        </div>
      </div>
      <label class="switch" style="cursor:pointer;" title="${dish.is_available ? 'Còn món' : 'Hết món'}">
        <input type="checkbox" ${dish.is_available ? 'checked' : ''} data-dish-id="${dish.id}" class="dish-toggle">
        <span style="
          display:inline-block;width:42px;height:24px;border-radius:12px;
          background:${dish.is_available ? 'linear-gradient(135deg,#ff9155,#ff7a27)' : '#474656'};
          position:relative;transition:background 0.3s;
        "></span>
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
  });

  // Wire availability toggles
  container.querySelectorAll('.dish-toggle').forEach((toggle) => {
    toggle.addEventListener('change', async () => {
      const dishId = toggle.dataset.dishId;
      const span = toggle.nextElementSibling;
      try {
        await api.put(`/api/dishes/${dishId}`, { is_available: toggle.checked });
        if (span) span.style.background = toggle.checked ? 'linear-gradient(135deg,#ff9155,#ff7a27)' : '#474656';
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
      try {
        await api.delete(`/api/dishes/${dishId}`);
        btn.closest('div').remove();
      } catch (err) {
        alert('Lỗi xóa món: ' + err.message);
      }
    });
  });
}

// ── Add Dish Form ─────────────────────────────────────────────────────────────
function wireAddDish(restaurantId) {
  const addBtn = document.querySelector('#add-dish-btn, [class*="thêm-món"], .add-dish-btn');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    // Build inline add dish dialog
    const existing = document.getElementById('add-dish-dialog');
    if (existing) { existing.remove(); return; }

    const dialog = document.createElement('div');
    dialog.id = 'add-dish-dialog';
    dialog.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9998;
      display:flex;align-items:center;justify-content:center;
    `;
    dialog.innerHTML = `
      <div style="background:#181828;border-radius:16px;padding:24px;width:90%;max-width:400px;">
        <h3 style="color:#ff9155;font-family:'Plus Jakarta Sans',sans-serif;margin:0 0 16px;">➕ Thêm Món Mới</h3>
        <input id="new-dish-name" placeholder="Tên món ăn *" style="${inputStyle}">
        <input id="new-dish-price" type="number" placeholder="Giá (VNĐ)" style="${inputStyle}">
        <input id="new-dish-image" placeholder="Link ảnh (tùy chọn)" style="${inputStyle}">
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button id="save-dish-btn" style="${btnStyle}">✅ Lưu Món</button>
          <button id="cancel-dish-btn" style="${cancelBtnStyle}">Hủy</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);

    document.getElementById('cancel-dish-btn').addEventListener('click', () => dialog.remove());
    document.getElementById('save-dish-btn').addEventListener('click', async () => {
      const name = document.getElementById('new-dish-name').value.trim();
      if (!name) { alert('Vui lòng nhập tên món.'); return; }
      const price = parseFloat(document.getElementById('new-dish-price').value) || null;
      const image_url = document.getElementById('new-dish-image').value.trim() || null;
      try {
        await api.post(`/api/restaurants/${restaurantId}/dishes`, { name, price, image_url });
        dialog.remove();
        // Refresh dish list
        const r = await api.get(`/api/restaurants/${restaurantId}`);
        renderOwnerDishes(r.dishes || [], restaurantId);
      } catch (err) {
        alert('Lỗi thêm món: ' + err.message);
      }
    });
  });
}

const inputStyle = `
  display:block;width:100%;padding:12px 16px;border-radius:8px;border:none;
  background:#242437;color:#e9e6f9;font-family:'Plus Jakarta Sans',sans-serif;
  font-size:14px;margin-bottom:10px;box-sizing:border-box;
`;
const btnStyle = `
  flex:1;padding:12px;border-radius:8px;border:none;cursor:pointer;
  background:linear-gradient(135deg,#ff9155,#ff7a27);color:#521f00;
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
      window.location.href = '/pages/login.html';
    });
  });
}

// ── Main Init ─────────────────────────────────────────────────────────────────
async function init() {
  if (!checkAuth()) return;

  wireLogout();

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
      window.location.href = '/pages/login.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
