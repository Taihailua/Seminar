/**
 * admin.js — Admin Dashboard
 * Chỉ xử lý 7 API Backend:
 *   GET  /api/admin/stats
 *   GET  /api/admin/restaurants/pending
 *   POST /api/admin/restaurants/{id}/approve
 *   POST /api/admin/restaurants/{id}/reject
 *   GET  /api/admin/users
 *   POST /api/admin/users/{id}/ban
 *   POST /api/admin/users/{id}/unban
 */
import { api, getAuth, clearAuth } from './api.js';

// ── Toast Notification System ─────────────────────────────────────────────────
function showToast(message, type = 'error') {
  document.querySelector('#admin-toast')?.remove();

  const colorMap = {
    error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#f87171', icon: '❌' },
    success: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#4ade80', icon: '✅' },
    info: { bg: 'rgba(14,165,233,0.15)', border: '#0ea5e9', text: '#38bdf8', icon: 'ℹ️' },
  };
  const c = colorMap[type] || colorMap.error;

  const toast = document.createElement('div');
  toast.id = 'admin-toast';
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);
    background:${c.bg};border:1px solid ${c.border};color:${c.text};
    padding:10px 20px;border-radius:12px;font-size:13px;font-weight:600;
    font-family:'Plus Jakarta Sans',sans-serif;
    z-index:9999;white-space:nowrap;
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    box-shadow:0 4px 24px rgba(0,0,0,0.4);
    transition:opacity 0.3s ease, transform 0.3s ease;
    opacity:0;
  `;
  toast.textContent = `${c.icon} ${message}`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// ── Auth Guard ────────────────────────────────────────────────────────────────
function checkAuth() {
  const { token, role } = getAuth();
  if (!token) { window.location.href = 'login.html'; return false; }
  if (role !== 'admin') { window.location.href = 'map.html'; return false; }
  return true;
}

// ── Stats Cards ───────────────────────────────────────────────────────────────
function populateStats(stats) {
  const statMap = {
    '[data-stat="users"], .stat-users': stats.total_users,
    '[data-stat="restaurants"], .stat-restaurants': stats.total_restaurants,
    '[data-stat="pending"], .stat-pending': stats.pending_restaurants,
    '[data-stat="scans"], .stat-scans': stats.total_scans.toLocaleString('vi-VN'),
    '[data-stat="reviews"], .stat-reviews': stats.total_reviews,
  };

  Object.entries(statMap).forEach(([selector, value]) => {
    document.querySelectorAll(selector).forEach((el) => (el.textContent = value));
  });

  // Pending badge
  const pendingBadge = document.querySelector('.pending-count');
  if (pendingBadge) {
    pendingBadge.textContent = stats.pending_restaurants;
    if (stats.pending_restaurants > 0) {
      pendingBadge.style.color = '#fbbf24';
    }
  }
}

// ── Helper: cập nhật số pending trực tiếp trên DOM ───────────────────────────
function updatePendingCount(delta) {
  document.querySelectorAll('.pending-count, .stat-pending').forEach((el) => {
    const current = parseInt(el.textContent, 10) || 0;
    el.textContent = Math.max(0, current + delta);
  });
}

// ── Pending Restaurants ───────────────────────────────────────────────────────
function renderPendingRestaurants(restaurants) {
  const container = document.querySelector('#pending-list');
  if (!container) return;

  container.innerHTML = '';

  if (!restaurants.length) {
    container.innerHTML = '<p style="color:#4ade80;text-align:center;padding:16px;">✅ Không có nhà hàng nào chờ duyệt</p>';
    return;
  }

  restaurants.forEach((r) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background:#181828;border-radius:12px;padding:16px;margin-bottom:12px;
      transition:opacity 0.3s ease;
    `;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:#e9e6f9;font-size:15px;margin-bottom:4px;">${r.name}</div>
          <div style="font-size:12px;color:#aba9bb;">📍 ${r.address || 'Chưa có địa chỉ'}</div>
          <div style="font-size:12px;color:#aba9bb;margin-top:2px;">
            🕐 ${new Date(r.created_at).toLocaleDateString('vi-VN')}
          </div>
        </div>
        <span style="
          background:rgba(251,191,36,0.2);color:#fbbf24;
          padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;
          flex-shrink:0;margin-left:8px;
        ">🟡 Đang chờ</span>
      </div>
      ${r.description ? `<p style="color:#aba9bb;font-size:13px;margin:0 0 12px;line-height:1.5;">${r.description.substring(0, 120)}...</p>` : ''}
      <div style="display:flex;gap:8px;">
        <button data-approve="${r.id}" style="
          flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;
          background:linear-gradient(135deg,#22c55e,#16a34a);
          color:#fff;font-weight:700;font-size:13px;
          font-family:'Plus Jakarta Sans',sans-serif;
          transition:opacity 0.2s;
        ">✅ Duyệt</button>
        <button data-reject="${r.id}" style="
          flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;
          background:linear-gradient(135deg,#ef4444,#b91c1c);
          color:#fff;font-weight:700;font-size:13px;
          font-family:'Plus Jakarta Sans',sans-serif;
          transition:opacity 0.2s;
        ">❌ Từ chối</button>
      </div>
    `;

    // Approve
    card.querySelector('[data-approve]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const id = btn.dataset.approve;
      btn.textContent = 'Đang xử lý...';
      btn.disabled = true;
      try {
        await api.post(`/api/admin/restaurants/${id}/approve`);
        card.style.opacity = '0.5';
        card.innerHTML = '<div style="color:#4ade80;text-align:center;padding:12px;">✅ Đã duyệt</div>';
        setTimeout(() => card.remove(), 1500);
        updatePendingCount(-1);
        showToast('Đã duyệt nhà hàng thành công!', 'success');
      } catch (err) {
        showToast('Lỗi khi duyệt: ' + err.message, 'error');
        btn.textContent = '✅ Duyệt';
        btn.disabled = false;
      }
    });

    // Reject
    card.querySelector('[data-reject]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const id = btn.dataset.reject;
      if (!confirm('Từ chối nhà hàng này?')) return;
      btn.textContent = 'Đang xử lý...';
      btn.disabled = true;
      try {
        await api.post(`/api/admin/restaurants/${id}/reject`);
        card.style.opacity = '0.5';
        card.innerHTML = '<div style="color:#f87171;text-align:center;padding:12px;">❌ Đã từ chối</div>';
        setTimeout(() => card.remove(), 1500);
        updatePendingCount(-1);
        showToast('Đã từ chối nhà hàng.', 'info');
      } catch (err) {
        showToast('Lỗi khi từ chối: ' + err.message, 'error');
        btn.textContent = '❌ Từ chối';
        btn.disabled = false;
      }
    });

    container.appendChild(card);
  });
}

// ── Users Table ───────────────────────────────────────────────────────────────
function renderUsersTable(users) {
  const container = document.querySelector('#users-list');
  if (!container) return;

  container.innerHTML = '';

  const roleColors = {
    admin: { bg: 'rgba(239,68,68,0.2)', color: '#f87171', label: '⚙️ Admin' },
    owner: { bg: 'rgba(14,165,233,0.2)', color: '#0ea5e9', label: '🏪 Chủ quán' },
    user: { bg: 'rgba(59,130,246,0.2)', color: '#60a5fa', label: '👤 User' },
  };

  users.forEach((user) => {
    const role = roleColors[user.role] || roleColors.user;
    const row = document.createElement('div');
    row.dataset.userId = user.id;
    row.style.cssText = `
      display:flex;align-items:center;gap:12px;padding:12px 16px;
      background:#1a1a2e;border-radius:10px;margin-bottom:8px;
      transition:opacity 0.2s ease;
    `;

    const initial = user.username[0].toUpperCase();
    row.innerHTML = `
      <div style="
        width:40px;height:40px;border-radius:50%;
        background:linear-gradient(135deg,#0ea5e9,#0284c7);
        display:flex;align-items:center;justify-content:center;
        font-weight:700;color:#521f00;font-size:15px;flex-shrink:0;
      ">${initial}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;color:#e9e6f9;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${user.username}
        </div>
        <div style="font-size:11px;color:#aba9bb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.email}</div>
      </div>
      <span style="
        background:${role.bg};color:${role.color};
        padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;
        white-space:nowrap;flex-shrink:0;
      ">${role.label}</span>
      <span class="user-status-badge" style="
        background:${user.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};
        color:${user.is_active ? '#4ade80' : '#f87171'};
        padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;
        white-space:nowrap;flex-shrink:0;
      ">${user.is_active ? 'Hoạt động' : 'Đã cấm'}</span>
      <button
        class="ban-toggle-btn"
        data-user-id="${user.id}"
        data-is-active="${user.is_active}"
        data-username="${user.username}"
        style="
          padding:6px 12px;border-radius:6px;border:none;cursor:pointer;
          background:${user.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'};
          color:${user.is_active ? '#f87171' : '#4ade80'};
          font-size:12px;font-weight:600;white-space:nowrap;flex-shrink:0;
          font-family:'Plus Jakarta Sans',sans-serif;
          transition:background 0.25s,color 0.25s;
        "
      >${user.is_active ? '🚫 Cấm' : '✅ Mở'}</button>
    `;

    // Ban / Unban — DOM Manipulation trực tiếp, không reload trang
    const actionBtn = row.querySelector('.ban-toggle-btn');
    actionBtn.addEventListener('click', async () => {
      const userId = actionBtn.dataset.userId;
      const isActive = actionBtn.dataset.isActive === 'true';
      const username = actionBtn.dataset.username;
      const statusBadge = row.querySelector('.user-status-badge');

      if (!confirm(`${isActive ? 'Cấm' : 'Mở khóa'} tài khoản @${username}?`)) return;

      actionBtn.disabled = true;
      actionBtn.style.opacity = '0.5';
      actionBtn.textContent = 'Đang xử lý...';

      try {
        const endpoint = isActive
          ? `/api/admin/users/${userId}/ban`
          : `/api/admin/users/${userId}/unban`;
        await api.post(endpoint);

        const newIsActive = !isActive;

        // Cập nhật nút
        actionBtn.dataset.isActive = String(newIsActive);
        actionBtn.textContent = newIsActive ? '🚫 Cấm' : '✅ Mở';
        actionBtn.style.background = newIsActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)';
        actionBtn.style.color = newIsActive ? '#f87171' : '#4ade80';
        actionBtn.style.opacity = '1';
        actionBtn.disabled = false;

        // Cập nhật badge trạng thái
        statusBadge.textContent = newIsActive ? 'Hoạt động' : 'Đã cấm';
        statusBadge.style.background = newIsActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';
        statusBadge.style.color = newIsActive ? '#4ade80' : '#f87171';

        showToast(
          `@${username} đã ${newIsActive ? 'được mở khóa' : 'bị cấm'} thành công.`,
          newIsActive ? 'success' : 'info'
        );
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
        actionBtn.textContent = isActive ? '🚫 Cấm' : '✅ Mở';
        actionBtn.style.opacity = '1';
        actionBtn.disabled = false;
      }
    });

    container.appendChild(row);
  });
}

// ── Search Filter ─────────────────────────────────────────────────────────────
function setupSearch(allUsers) {
  const searchInput = document.querySelector('#user-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    const filtered = allUsers.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    renderUsersTable(filtered);
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────
function wireLogout() {
  document.querySelectorAll('#btn-logout, [class*="logout"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'login.html';
    });
  });
}

// ── Admin Profile Card ───────────────────────────────────────────────────────
// Bước 1: Đổ tên từ localStorage ngay lập tức (không chờ API) → xóa "Đang tải..."
// Bước 2: Gọi GET /api/auth/me để bổ sung email & ngày tham gia
async function populateProfile() {
  const { username } = getAuth();

  // Đổ tên & initial ngay từ token (instant, không cần API)
  const nameEl = document.querySelector('#admin-name');
  const emailEl = document.querySelector('#admin-email');
  const joinedEl = document.querySelector('#admin-joined');
  const initialEl = document.querySelector('#admin-initial');

  if (nameEl) nameEl.textContent = username || 'Admin';
  if (initialEl) initialEl.textContent = (username?.[0] ?? 'A').toUpperCase();

  // Gọi API để lấy email + ngày tham gia
  try {
    const me = await api.get('/api/auth/me');
    if (emailEl) emailEl.textContent = me.email || '';
    if (joinedEl) joinedEl.textContent = me.created_at
      ? `🗓️ Tham gia: ${new Date(me.created_at).toLocaleDateString('vi-VN')}`
      : '';
    // Cập nhật lại tên nếu API trả về đầy đủ hơn
    if (nameEl && me.username) nameEl.textContent = me.username;
    if (initialEl && me.username) initialEl.textContent = me.username[0].toUpperCase();
  } catch {
    // Không fail app nếu /api/auth/me lỗi — dữ liệu từ token vẫn hiển thị
    if (emailEl) emailEl.textContent = '(Không thể tải email)';
    if (joinedEl) joinedEl.textContent = '';
  }
}

// ── Main Init ─────────────────────────────────────────────────────────────────
async function init() {
  if (!checkAuth()) return;

  wireLogout();
  await populateProfile(); // Điền profile card trước, không block luồng data

  try {
    const [stats, pending, users] = await Promise.all([
      api.get('/api/admin/stats'),
      api.get('/api/admin/restaurants/pending'),
      api.get('/api/admin/users'),
    ]);

    populateStats(stats);
    renderPendingRestaurants(pending);
    renderUsersTable(users);
    setupSearch(users);
  } catch (err) {
    console.error('Admin init error:', err);
    if (err.message?.includes('401') || err.message?.includes('403')) {
      clearAuth();
      window.location.href = 'login.html';
    } else {
      showToast('Không thể tải dữ liệu dashboard: ' + err.message, 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
