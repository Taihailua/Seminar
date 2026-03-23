/**
 * admin.js — Admin dashboard: global stats, pending approvals, user management
 * All static Stitch data replaced with live API calls + dynamic loops.
 */
import { api, getAuth, clearAuth } from './api.js';

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

  // Generic big number update (for Stitch-generated grid)
  const statNumbers = document.querySelectorAll('.stat-number, [class*="stat-value"], [class*="big-number"]');
  const values = [stats.total_users, stats.total_restaurants, stats.pending_restaurants, stats.total_scans, stats.total_reviews];
  statNumbers.forEach((el, i) => {
    if (values[i] !== undefined) el.textContent = values[i];
  });

  // Pending badge with pulsing dot
  const pendingBadge = document.querySelector('.pending-count, [class*="pending-badge"]');
  if (pendingBadge) {
    pendingBadge.textContent = stats.pending_restaurants;
    if (stats.pending_restaurants > 0) {
      pendingBadge.style.background = 'rgba(251,191,36,0.25)';
      pendingBadge.style.color = '#fbbf24';
    }
  }
}

// ── Pending Restaurant Loop ───────────────────────────────────────────────────
function renderPendingRestaurants(restaurants) {
  const container = document.querySelector(
    '#pending-list, .pending-list, [class*="chờ-duyệt"] .restaurant-cards, [class*="pending"]'
  );
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

    // Wire approve button
    card.querySelector('[data-approve]').addEventListener('click', async (e) => {
      const id = e.target.dataset.approve;
      e.target.textContent = 'Đang xử lý...';
      e.target.disabled = true;
      try {
        await api.post(`/api/admin/restaurants/${id}/approve`);
        card.style.opacity = '0.5';
        card.innerHTML = '<div style="color:#4ade80;text-align:center;padding:12px;">✅ Đã duyệt</div>';
        setTimeout(() => card.remove(), 1500);
      } catch (err) {
        alert('Lỗi: ' + err.message);
        e.target.textContent = '✅ Duyệt';
        e.target.disabled = false;
      }
    });

    // Wire reject button
    card.querySelector('[data-reject]').addEventListener('click', async (e) => {
      const id = e.target.dataset.reject;
      if (!confirm('Từ chối nhà hàng này?')) return;
      e.target.textContent = 'Đang xử lý...';
      e.target.disabled = true;
      try {
        await api.post(`/api/admin/restaurants/${id}/reject`);
        card.style.opacity = '0.5';
        card.innerHTML = '<div style="color:#f87171;text-align:center;padding:12px;">❌ Đã từ chối</div>';
        setTimeout(() => card.remove(), 1500);
      } catch (err) {
        alert('Lỗi: ' + err.message);
        e.target.textContent = '❌ Từ chối';
        e.target.disabled = false;
      }
    });

    container.appendChild(card);
  });
}

// ── Users Table Loop ──────────────────────────────────────────────────────────
function renderUsersTable(users) {
  const container = document.querySelector(
    '#users-list, .users-table, [class*="người-dùng"] .user-list, [class*="user-manage"]'
  );
  if (!container) return;

  container.innerHTML = '';

  const roleColors = {
    admin: { bg: 'rgba(239,68,68,0.2)', color: '#f87171', label: '⚙️ Admin' },
    owner: { bg: 'rgba(14, 165, 233,0.2)', color: '#0ea5e9', label: '🏪 Chủ quán' },
    user: { bg: 'rgba(59,130,246,0.2)', color: '#60a5fa', label: '👤 User' },
  };

  users.forEach((user) => {
    const role = roleColors[user.role] || roleColors.user;
    const row = document.createElement('div');
    row.style.cssText = `
      display:flex;align-items:center;gap:12px;padding:12px 16px;
      background:#1a1a2e;border-radius:10px;margin-bottom:8px;
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
      <span style="
        background:${user.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};
        color:${user.is_active ? '#4ade80' : '#f87171'};
        padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;
        white-space:nowrap;flex-shrink:0;
      ">${user.is_active ? 'Hoạt động' : 'Đã cấm'}</span>
      <button data-user-id="${user.id}" data-is-active="${user.is_active}" data-username="${user.username}" style="
        padding:6px 12px;border-radius:6px;border:none;cursor:pointer;
        background:${user.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'};
        color:${user.is_active ? '#f87171' : '#4ade80'};
        font-size:12px;font-weight:600;white-space:nowrap;flex-shrink:0;
        font-family:'Plus Jakarta Sans',sans-serif;
      ">${user.is_active ? '🚫 Cấm' : '✅ Mở'}</button>
    `;

    // Wire ban/unban button
    const actionBtn = row.querySelector('[data-user-id]');
    actionBtn.addEventListener('click', async () => {
      const userId = actionBtn.dataset.userId;
      const isActive = actionBtn.dataset.isActive === 'true';
      const username = actionBtn.dataset.username;

      if (!confirm(`${isActive ? 'Cấm' : 'Mở khóa'} tài khoản @${username}?`)) return;

      try {
        const endpoint = isActive
          ? `/api/admin/users/${userId}/ban`
          : `/api/admin/users/${userId}/unban`;
        await api.post(endpoint);
        // Refresh list
        const users = await api.get('/api/admin/users');
        renderUsersTable(users);
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    });

    container.appendChild(row);
  });
}

// ── Search Filter ─────────────────────────────────────────────────────────────
function setupSearch(allUsers) {
  const searchInput = document.querySelector('#user-search, .user-search, [placeholder*="tìm kiếm"]');
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
  document.querySelectorAll('[class*="logout"], [class*="đăng-xuất"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'login.html';
    });
  });
}

// ── Header ────────────────────────────────────────────────────────────────────
function populateHeader() {
  const { username } = getAuth();
  document.querySelectorAll('.admin-username, [class*="admin-name"]').forEach(
    (el) => (el.textContent = username || 'Admin')
  );
}

// ── Main Init ─────────────────────────────────────────────────────────────────
async function init() {
  if (!checkAuth()) return;

  wireLogout();
  populateHeader();

  try {
    // Parallel fetch: stats + pending + users
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
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
