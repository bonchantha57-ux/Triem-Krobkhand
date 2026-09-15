import './style.css';
import { StorageService } from './services/storage.js';
import { renderHomeView } from './components/homeView.js';
import { renderExamLibraryView } from './components/examLibraryView.js';
import { renderQuizSimulatorView } from './components/quizSimulatorView.js';
import { renderSettingsView } from './components/settingsView.js';
import { renderProfileView } from './components/profileView.js';
import { renderAdminView } from './components/adminView.js';
import { renderExamDetailView } from './components/examDetailView.js';
import { openAuthModal } from './components/authModal.js';
import { CloudflareService } from './services/cloudflareApi.js';
import { getIcon } from './utils/icons.js';

// Application State
let currentTab = 'home';
let tabParams = {};
let isAdminAuthenticated = false;

// DOM Elements
const viewContainer = document.getElementById('view-container');
const modalContainer = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-content');
const toastContainer = document.getElementById('toast-container');
const themeToggleBtn = document.getElementById('btn-theme-toggle');
const authAccessBtn = document.getElementById('btn-auth-access') || document.getElementById('btn-admin-access');
const brandLogo = document.getElementById('brand-logo');

// 1. Toast Notification Helper
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-message ${type}`;
  const icon = type === 'success' ? getIcon('checkCircle') : (type === 'error' ? getIcon('alertCircle') : getIcon('info'));
  toast.innerHTML = `<span style="display: inline-flex; align-items: center;">${icon}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 2. Exam Reader (Direct navigation to full-page Exam Detail View)
export function openExamModal(exam) {
  if (!exam) return;
  const examId = typeof exam === 'string' ? exam : exam.id;
  navigateTo('exam-detail', { examId });
}

// Close modal when clicking outside content
modalContainer.addEventListener('click', (e) => {
  if (e.target === modalContainer) {
    modalContainer.classList.add('hidden');
  }
});

// 3. User Authentication State & Header UI
function updateAuthUI() {
  if (!authAccessBtn) return;
  const currentUser = StorageService.getCurrentUser();

  if (currentUser) {
    authAccessBtn.classList.add('logged-in');
    const roleIcon = currentUser.role === 'admin' ? getIcon('crown') : getIcon('user');
    authAccessBtn.innerHTML = `
      <span class="auth-avatar" style="display: inline-flex; align-items: center;">${roleIcon}</span>
      <span class="auth-text">${currentUser.name}</span>
    `;
    authAccessBtn.title = `បានចូលគណនីជា៖ ${currentUser.name} (${currentUser.email})`;
  } else {
    authAccessBtn.classList.remove('logged-in');
    authAccessBtn.innerHTML = `
      <span class="auth-icon" style="display: inline-flex; align-items: center;">${getIcon('user')}</span>
      <span class="auth-text">Login</span>
    `;
    authAccessBtn.title = 'ចូលគណនី ឬ ចុះឈ្មោះ';
  }
}

// Open User Profile Menu / Logout Sheet
function openUserMenuModal(user) {
  modalContent.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.4rem;">
        <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('user')}</span>
        <span>ព័ត៌មានគណនី</span>
      </h3>
      <button class="modal-close-btn" id="btn-close-user-menu" style="display: inline-flex; align-items: center; justify-content: center;">${getIcon('x')}</button>
    </div>
    <div class="modal-body" style="text-align: center; padding: 1.5rem;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-700), var(--primary-500)); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
        ${user.role === 'admin' ? getIcon('crown') : getIcon('user')}
      </div>
      <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">
        ${user.name}
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
        ${user.email}
      </p>
      <div style="display: inline-block; padding: 0.25rem 0.85rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600; background: ${user.role === 'admin' ? '#fef3c7' : 'var(--primary-50)'}; color: ${user.role === 'admin' ? '#b45309' : 'var(--primary-700)'}; margin-bottom: 1.5rem;">
        ${user.role === 'admin' ? 'គណនីរដ្ឋបាល (Admin)' : 'បេក្ខជនប្រឡងក្របខ័ណ្ឌ'}
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.6rem; max-width: 320px; margin: 0 auto;">
        <button id="btn-menu-go-profile" class="btn-primary" style="justify-content: center; padding: 0.65rem; display: inline-flex; align-items: center; gap: 0.35rem;">
          ${getIcon('user')} <span>មើលទំព័រ Profile របស់ខ្ញុំ</span>
        </button>

        ${user.role === 'admin' ? `
          <button id="btn-menu-go-admin" class="btn-secondary" style="justify-content: center; padding: 0.65rem; color: var(--text-primary); border-color: var(--primary-500); background: var(--primary-50); display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('shield')} <span>ផ្ទាំងគ្រប់គ្រង Admin</span>
          </button>
        ` : ''}

        <button id="btn-menu-logout" class="btn-secondary" style="justify-content: center; padding: 0.65rem; color: var(--danger-600); border-color: var(--danger-500); background: var(--danger-50); display: inline-flex; align-items: center; gap: 0.35rem;">
          ${getIcon('logout')} <span>ចាកចេញពីគណនី (Logout)</span>
        </button>
      </div>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  const closeMenu = () => modalContainer.classList.add('hidden');
  modalContent.querySelector('#btn-close-user-menu')?.addEventListener('click', closeMenu);

  modalContent.querySelector('#btn-menu-go-profile')?.addEventListener('click', () => {
    closeMenu();
    navigateTo('profile');
  });

  modalContent.querySelector('#btn-menu-go-admin')?.addEventListener('click', () => {
    closeMenu();
    navigateTo('admin');
  });

  modalContent.querySelector('#btn-menu-logout')?.addEventListener('click', () => {
    StorageService.logout();
    updateAuthUI();
    closeMenu();
    showToast('បានចាកចេញពីគណនីដោយជោគជ័យ', 'info');
    navigateTo('home');
  });
}

// 4. Navigation Controller
export function navigateTo(tab, params = {}) {
  currentTab = tab;
  tabParams = params;

  // Update Desktop active nav
  document.querySelectorAll('.desktop-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Update Mobile active nav
  document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Render View
  renderCurrentView();
}

window.refreshAppAuthUI = updateAuthUI;

export function triggerAuthModal(initialTab = 'login') {
  openAuthModal(modalContainer, modalContent, (user, targetTab) => {
    updateAuthUI();
    if (targetTab === 'admin' || user?.role === 'admin') {
      navigateTo('admin');
    } else {
      renderCurrentView();
    }
  }, showToast, initialTab);
}

function renderCurrentView() {
  viewContainer.innerHTML = '';
  const currentUser = StorageService.getCurrentUser();

  switch (currentTab) {
    case 'home':
      renderHomeView(viewContainer, navigateTo, openExamModal);
      break;
    case 'exams':
      renderExamLibraryView(viewContainer, tabParams, openExamModal);
      break;
    case 'exam-detail':
      renderExamDetailView(viewContainer, tabParams.examId || tabParams.id, navigateTo, showToast);
      break;
    case 'quiz':
      renderQuizSimulatorView(viewContainer, navigateTo, showToast);
      break;
    case 'settings':
      renderSettingsView(viewContainer, showToast, renderCurrentView);
      break;
    case 'profile':
      renderProfileView(viewContainer, showToast, openExamModal, navigateTo, triggerAuthModal);
      break;
    case 'admin':
      // Auto allow if user is logged in as admin
      if (currentUser?.role === 'admin' || isAdminAuthenticated) {
        renderAdminView(viewContainer, showToast, renderCurrentView);
      } else {
        promptAdminAccess();
      }
      break;
    default:
      renderHomeView(viewContainer, navigateTo, openExamModal);
  }
}

// 5. Admin Access Dialog (Cloudflare D1 Authenticated)
function promptAdminAccess() {
  modalContent.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.4rem;">
        <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('shield')}</span>
        <span>ផ្ទៀងផ្ទាត់សិទ្ធិ Admin</span>
      </h3>
      <button class="modal-close-btn" id="btn-close-admin-modal" style="display: inline-flex; align-items: center; justify-content: center;">${getIcon('x')}</button>
    </div>
    <div class="modal-body" style="padding: 1.75rem 1.5rem;">
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: var(--primary-50); color: var(--primary-600); margin-bottom: 0.5rem;">
          ${getIcon('lock')}
        </div>
        <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
          ចូលផ្ទាំងគ្រប់គ្រង Admin
        </h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
          សូមបញ្ចូល Email និង ពាក្យសម្ងាត់ដើម្បីគ្រប់គ្រងប្រព័ន្ធ
        </p>
      </div>

      <form id="admin-login-form">
        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label class="form-label">Email របស់ Admin</label>
          <div style="position: relative;">
            <span style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: inline-flex;">
              ${getIcon('mail')}
            </span>
            <input type="email" id="admin-access-email" class="form-input" placeholder="admin@example.com" style="padding-left: 2.5rem;" required autofocus />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label">ពាក្យសម្ងាត់ Admin (Password)</label>
          <div style="position: relative;">
            <span style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: inline-flex;">
              ${getIcon('lock')}
            </span>
            <input type="password" id="admin-access-pwd" class="form-input" placeholder="បញ្ចូលពាក្យសម្ងាត់..." style="padding-left: 2.5rem;" required />
          </div>
        </div>

        <button type="submit" id="btn-submit-admin-login" class="btn-primary" style="width: 100%; justify-content: center; padding: 0.75rem;">
          ផ្ទៀងផ្ទាត់ចូល Admin
        </button>
      </form>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  const closeAdminModal = () => {
    modalContainer.classList.add('hidden');
    navigateTo('home');
  };

  modalContent.querySelector('#btn-close-admin-modal')?.addEventListener('click', closeAdminModal);

  modalContent.querySelector('#admin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = modalContent.querySelector('#btn-submit-admin-login');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'កំពុងផ្ទៀងផ្ទាត់...';
    }

    const email = modalContent.querySelector('#admin-access-email').value.trim();
    const password = modalContent.querySelector('#admin-access-pwd').value;

    const res = await StorageService.loginWithEmail(email, password);
    if (res.success && res.user?.role === 'admin') {
      isAdminAuthenticated = true;
      modalContainer.classList.add('hidden');
      showToast('ចូល Admin ជោគជ័យ!', 'success');
      renderAdminView(viewContainer, showToast, renderCurrentView);
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'ផ្ទៀងផ្ទាត់ចូល Admin';
      }
      showToast(res.message || 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!', 'error');
    }
  });
}

// 6. Initialize Theme and Settings
function initializeTheme() {
  const settings = StorageService.getSettings();

  // Apply theme
  if (settings.theme === 'dark') {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    if (themeToggleBtn) themeToggleBtn.innerHTML = getIcon('sun');
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    if (themeToggleBtn) themeToggleBtn.innerHTML = getIcon('moon');
  }

  // Apply font size
  if (settings.fontSize) {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${settings.fontSize}`);
  }
}

// Toggle Theme Handler
themeToggleBtn?.addEventListener('click', () => {
  const isDark = document.body.classList.contains('theme-dark');
  if (isDark) {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    themeToggleBtn.innerHTML = getIcon('moon');
    StorageService.saveSettings({ theme: 'light' });
  } else {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    themeToggleBtn.innerHTML = getIcon('sun');
    StorageService.saveSettings({ theme: 'dark' });
  }
});

// Auth / Login button click
authAccessBtn?.addEventListener('click', () => {
  const currentUser = StorageService.getCurrentUser();
  if (currentUser) {
    openUserMenuModal(currentUser);
  } else {
    openAuthModal(modalContainer, modalContent, (user, targetTab) => {
      updateAuthUI();
      if (targetTab === 'admin' || user?.role === 'admin') {
        navigateTo('admin');
      } else {
        renderCurrentView();
      }
    }, showToast);
  }
});

// Brand click -> home
brandLogo?.addEventListener('click', () => {
  navigateTo('home');
});

// Desktop Navigation Items
document.querySelectorAll('.desktop-nav .nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    navigateTo(btn.dataset.tab);
  });
});

// Mobile Bottom Navigation Items
document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    navigateTo(btn.dataset.tab);
  });
});

// Boot the App
StorageService.init();
initializeTheme();
updateAuthUI();
navigateTo('home');

// Background silent pull from Cloudflare D1 for all users (candidates)
async function initBackgroundSync() {
  try {
    const settings = StorageService.getSettings();
    if (!settings.cfWorkerUrl) return;

    const res = await CloudflareService.pullData(settings.cfWorkerUrl, settings.cfApiKey);
    if (res && res.success) {
      let hasUpdates = false;
      if (Array.isArray(res.exams) && res.exams.length > 0) {
        StorageService.setAllExams(res.exams);
        hasUpdates = true;
      }
      if (Array.isArray(res.questions) && res.questions.length > 0) {
        StorageService.setAllQuestions(res.questions);
        hasUpdates = true;
      }
      if (hasUpdates && (currentTab === 'home' || currentTab === 'exams')) {
        renderCurrentView();
      }
    }

    // Also fetch remote Firebase Auth configuration from Cloudflare D1
    await StorageService.fetchRemoteFirebaseConfig();
  } catch (err) {
    // Silent background fallback to cached/offline data
  }
}

// Trigger background sync safely without blocking UI
if (typeof window !== 'undefined') {
  setTimeout(initBackgroundSync, 800);
}
