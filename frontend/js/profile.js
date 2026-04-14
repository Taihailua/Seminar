/**
 * profile.js — Handles fetching the user's personal profile information via the '/api/auth/me' endpoint
 * and handles the user logout action.
 */
import { api, getAuth, clearAuth } from './api.js';

async function init() {
  const { token, role } = getAuth();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Set up the back button depending on role
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else if (role === 'owner') {
        window.location.href = 'owner-dashboard.html';
      } else {
        window.location.href = 'map.html';
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'login.html';
    });
  }

  try {
    const userProfile = await api.get('/api/auth/me');
    
    // Set Avatar Initial
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl && userProfile.username) {
      avatarEl.textContent = userProfile.username.charAt(0).toUpperCase();
    }

    // Set Username
    const usernameEl = document.getElementById('profile-username');
    if (usernameEl) {
      usernameEl.textContent = userProfile.username;
    }

    // Set Role String
    const roleEl = document.getElementById('profile-role');
    if (roleEl) {
      let displayRole = 'Khách viếng thăm';
      if (userProfile.role === 'admin') displayRole = 'Quản trị viên (Admin)';
      else if (userProfile.role === 'owner') displayRole = 'Chủ nhà hàng';
      roleEl.textContent = displayRole;
    }

    // Set Email
    const emailEl = document.getElementById('profile-email');
    if (emailEl) {
      emailEl.textContent = userProfile.email;
    }

    // Set Joined Date
    const joinedEl = document.getElementById('profile-joined');
    if (joinedEl && userProfile.created_at) {
      const date = new Date(userProfile.created_at);
      joinedEl.textContent = date.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    }

  } catch (err) {
    console.error('Failed to load user profile:', err);
    if (err.message?.includes('401')) {
      clearAuth();
      window.location.href = 'login.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
