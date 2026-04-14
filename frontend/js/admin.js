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
  // Responsive toast — capped width, centered, safe on mobile
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-[90vw] sm:max-w-sm px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 opacity-0 translate-y-5 whitespace-nowrap';
  toast.style.cssText = `background:${c.bg};border:1px solid ${c.border};color:${c.text};font-family:'Plus Jakarta Sans',sans-serif;`;
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
    container.innerHTML = '<p class="text-[#4ade80] text-center py-4 text-sm">✅ Không có nhà hàng nào chờ duyệt</p>';
    return;
  }

  restaurants.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'bg-[#181828] rounded-xl p-4 transition-opacity';

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div class="flex-1 min-w-0">
          <div class="font-bold text-[#e9e6f9] text-sm sm:text-[15px] mb-1">${r.name}</div>
          <div class="text-xs text-[#aba9bb]">📍 ${r.address || 'Chưa có địa chỉ'}</div>
          <div class="text-xs text-[#aba9bb] mt-0.5">🕐 ${new Date(r.created_at).toLocaleDateString('vi-VN')}</div>
        </div>
        <span class="self-start flex-shrink-0 bg-[rgba(251,191,36,0.2)] text-[#fbbf24] px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold">🟡 Đang chờ</span>
      </div>
      ${r.description ? `<p class="text-[#aba9bb] text-xs sm:text-[13px] mb-3 leading-relaxed line-clamp-2">${r.description.substring(0, 120)}...</p>` : ''}
      <div class="flex gap-2">
        <button data-approve="${r.id}" class="flex-1 py-2.5 rounded-lg border-none cursor-pointer bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white font-bold text-xs sm:text-[13px] font-['Plus_Jakarta_Sans'] transition-opacity active:scale-[0.98]">
          ✅ Duyệt
        </button>
        <button data-reject="${r.id}" class="flex-1 py-2.5 rounded-lg border-none cursor-pointer bg-gradient-to-br from-[#ef4444] to-[#b91c1c] text-white font-bold text-xs sm:text-[13px] font-['Plus_Jakarta_Sans'] transition-opacity active:scale-[0.98]">
          ❌ Từ chối
        </button>
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
        card.innerHTML = '<div class="text-[#4ade80] text-center py-3 text-sm">✅ Đã duyệt</div>';
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
        card.innerHTML = '<div class="text-[#f87171] text-center py-3 text-sm">❌ Đã từ chối</div>';
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
    row.className = 'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-[#1a1a2e] rounded-xl transition-opacity';

    const initial = user.username[0].toUpperCase();
    row.innerHTML = `
      <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center font-bold text-[#521f00] text-sm flex-shrink-0">
        ${initial}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-[#e9e6f9] text-xs sm:text-sm truncate">${user.username}</div>
        <div class="text-[10px] sm:text-[11px] text-[#aba9bb] truncate">${user.email}</div>
      </div>
      <span class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap flex-shrink-0"
        style="background:${role.bg};color:${role.color};">${role.label}</span>
      <span class="user-status-badge px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap flex-shrink-0"
        style="background:${user.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};color:${user.is_active ? '#4ade80' : '#f87171'};">
        ${user.is_active ? 'Hoạt động' : 'Đã cấm'}
      </span>
      <button
        class="ban-toggle-btn flex-shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg border-none cursor-pointer text-[11px] sm:text-xs font-semibold whitespace-nowrap font-['Plus_Jakarta_Sans'] transition-all"
        data-user-id="${user.id}"
        data-is-active="${user.is_active}"
        data-username="${user.username}"
        style="background:${user.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'};color:${user.is_active ? '#f87171' : '#4ade80'};"
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
