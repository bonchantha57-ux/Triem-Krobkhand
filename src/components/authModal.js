import { StorageService } from '../services/storage.js';
import { MINISTRIES } from '../data/defaultData.js';
import { getIcon } from '../utils/icons.js';

export function openAuthModal(modalContainer, modalContent, onAuthSuccess, showToast, initialTab = 'login') {
  let activeAuthTab = initialTab; // 'login' or 'register'
  let showPassword = false;

  function renderModal() {
    modalContent.innerHTML = `
      <div class="modal-header">
        <div style="display: flex; gap: 0.5rem; background: var(--bg-subtle); padding: 0.25rem; border-radius: var(--radius-full);">
          <button id="tab-btn-login" class="admin-tab-btn ${activeAuthTab === 'login' ? 'active' : ''}" style="padding: 0.4rem 1.1rem; font-size: 0.88rem;">
            ចូលគណនី (Login)
          </button>
          <button id="tab-btn-register" class="admin-tab-btn ${activeAuthTab === 'register' ? 'active' : ''}" style="padding: 0.4rem 1.1rem; font-size: 0.88rem;">
            ចុះឈ្មោះ (Register)
          </button>
        </div>
        <button class="modal-close-btn" id="btn-close-auth-modal" aria-label="Close" style="display: inline-flex; align-items: center; justify-content: center;">
          ${getIcon('x')}
        </button>
      </div>

      <div class="modal-body" style="padding: 1.5rem 1.75rem;">
        ${activeAuthTab === 'login' ? renderLoginForm() : renderRegisterForm()}
      </div>
    `;

    modalContainer.classList.remove('hidden');

    // Close button
    modalContent.querySelector('#btn-close-auth-modal')?.addEventListener('click', () => {
      modalContainer.classList.add('hidden');
    });

    // Tab buttons
    modalContent.querySelector('#tab-btn-login')?.addEventListener('click', () => {
      activeAuthTab = 'login';
      renderModal();
    });

    modalContent.querySelector('#tab-btn-register')?.addEventListener('click', () => {
      activeAuthTab = 'register';
      renderModal();
    });

    // Toggle Password Visibility
    modalContent.querySelector('#btn-toggle-pwd')?.addEventListener('click', () => {
      showPassword = !showPassword;
      const pwdInput = modalContent.querySelector('#auth-password');
      if (pwdInput) {
        pwdInput.type = showPassword ? 'text' : 'password';
        const eyeBtn = modalContent.querySelector('#btn-toggle-pwd');
        if (eyeBtn) eyeBtn.innerHTML = showPassword ? getIcon('eyeOff') : getIcon('eye');
      }
    });

    // Handle Google Connect
    modalContent.querySelectorAll('.btn-google-auth').forEach(btn => {
      btn.addEventListener('click', () => {
        handleGoogleLogin();
      });
    });

    // Handle Login Form Submit
    if (activeAuthTab === 'login') {
      const loginForm = modalContent.querySelector('#login-form');
      loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const origContent = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>កំពុងផ្ទៀងផ្ទាត់...</span>';
        }

        const email = modalContent.querySelector('#auth-email').value.trim();
        const password = modalContent.querySelector('#auth-password').value;

        const res = await StorageService.loginWithEmail(email, password);
        if (res.success) {
          modalContainer.classList.add('hidden');
          if (res.user.role === 'admin') {
            showToast('ស្វាគមន៍ Admin! ចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង...', 'success');
            onAuthSuccess(res.user, 'admin');
          } else {
            showToast(`ស្វាគមន៍ការត្រឡប់មកវិញ ${res.user.name}!`, 'success');
            onAuthSuccess(res.user, 'home');
          }
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origContent;
          }
          showToast(res.message, 'error');
        }
      });
    }

    // Handle Register Form Submit
    if (activeAuthTab === 'register') {
      const registerForm = modalContent.querySelector('#register-form');
      registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const origContent = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>កំពុងចុះឈ្មោះ...</span>';
        }

        const name = modalContent.querySelector('#reg-name').value.trim();
        const email = modalContent.querySelector('#reg-email').value.trim();
        const password = modalContent.querySelector('#reg-password').value;
        const targetMinistry = modalContent.querySelector('#reg-ministry').value;

        if (password.length < 4) {
          showToast('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ!', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origContent;
          }
          return;
        }

        const res = await StorageService.registerUser({ name, email, password, targetMinistry });
        if (res.success) {
          showToast(`បានបង្កើតគណនីជោគជ័យ! ស្វាគមន៍ ${res.user.name}`, 'success');
          modalContainer.classList.add('hidden');
          onAuthSuccess(res.user);
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origContent;
          }
          showToast(res.message, 'error');
        }
      });
    }
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  async function handleGoogleLogin() {
    let settings = StorageService.getSettings();
    let fbConfig = settings.firebaseConfig;
    let clientId = (settings.googleClientId || '').trim();

    // If config not yet loaded in local storage, attempt to fetch from Cloudflare D1
    if ((!fbConfig || !fbConfig.apiKey) && !clientId) {
      showToast('កំពុងទាញការកំណត់ Google ពី Cloudflare D1...', 'info');
      try {
        const remoteConfig = await StorageService.fetchRemoteFirebaseConfig();
        if (remoteConfig) {
          settings = StorageService.getSettings();
          fbConfig = settings.firebaseConfig;
          clientId = (settings.googleClientId || '').trim();
        }
      } catch (e) {}
    }

    // 1. Firebase Auth Web SDK (Native Google Provider Popup)
    if (fbConfig && fbConfig.apiKey) {
      showToast('កំពុងបើកផ្ទាំង Google Sign-In...', 'info');
      try {
        const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');

        const app = getApps().length === 0 ? initializeApp(fbConfig) : getApp();
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        if (!fbUser || !fbUser.email) {
          throw new Error('មិនអាចចាប់យក Email ពី Google Account បានទេ');
        }

        showToast('កំពុងរក្សាទុកគណនីក្នុង Cloudflare D1...', 'info');
        const res = await StorageService.loginWithGoogle({
          name: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          picture: fbUser.photoURL || '',
          sub: fbUser.uid,
          provider: 'google'
        });

        if (res.success) {
          showToast(`បានចូលគណនី Google (${res.user.email}) ដោយជោគជ័យ!`, 'success');
          modalContainer.classList.add('hidden');
          onAuthSuccess(res.user);
          return;
        } else {
          showToast(res.message || 'បរាជ័យក្នុងការ Sync ចូល Cloudflare D1', 'error');
          return;
        }
      } catch (err) {
        console.error('Firebase Auth error:', err);
        if (err.code === 'auth/unauthorized-domain') {
          alert(`[Firebase Error]: Domain "${window.location.hostname}" មិនទាន់បានអនុញ្ញាតក្នុង Firebase ឡើយ!\n\nសូមចូលទៅកាន់ Firebase Console (គម្រោង DB-DATA-FB) > Authentication > Settings > Authorized domains > ចុច Add domain រួចដាក់:\n${window.location.hostname}`);
          return;
        } else if (err.code === 'auth/popup-closed-by-user') {
          showToast('អ្នកបានបិទផ្ទាំង Google Sign-in', 'info');
          return;
        } else if (err.code === 'auth/cancelled-popup-request') {
          return;
        } else {
          showToast('Firebase Google Auth បរាជ័យ៖ ' + (err.message || err.code), 'error');
          return;
        }
      }
    }

    // 2. Fallback: Google Identity Services (Google OAuth 2.0 Client ID)
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              showToast('បរាជ័យក្នុងការភ្ជាប់ជាមួយ Google៖ ' + tokenResponse.error, 'error');
              return;
            }

            showToast('កំពុងចាប់យកព័ត៌មានពី Google...', 'info');
            try {
              const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              }).then(r => r.json());

              if (!userInfo || !userInfo.email) {
                throw new Error('មិនអាចទាញទិន្នន័យ Email ពី Google បានទេ');
              }

              const res = await StorageService.loginWithGoogle({
                name: userInfo.name || userInfo.email.split('@')[0],
                email: userInfo.email,
                picture: userInfo.picture || '',
                sub: userInfo.sub,
                provider: 'google'
              });

              if (res.success) {
                showToast(`បានចូលគណនី Google (${res.user.email}) ដោយជោគជ័យ!`, 'success');
                modalContainer.classList.add('hidden');
                onAuthSuccess(res.user);
              } else {
                showToast(res.message || 'បរាជ័យក្នុងការ Sync ចូល D1', 'error');
              }
            } catch (err) {
              showToast('បរាជ័យក្នុងការចាប់យក Account ពី Google៖ ' + err.message, 'error');
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('Google OAuth Token Client error:', e);
      }
    }

    // 3. Neither is configured yet
    showToast('មុខងារ Google Sign-In មិនទាន់បានកំណត់ Firebase Config ក្នុង Cloudflare D1 ឡើយ។ សូម Admin ចូលផ្ទាំង Admin > Users រួច Paste Firebase Config។', 'info');
  }

  function renderLoginForm() {
    return `
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <div style="width: 56px; height: 56px; border-radius: 16px; overflow: hidden; margin: 0 auto 0.65rem; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25); border: 2px solid rgba(217, 119, 6, 0.35);">
          <img src="./logo.jpg" onerror="this.onerror=null; this.src='logo.jpg';" alt="Triem Krobkhand Logo" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">
          ចូលគណនីត្រៀមក្របខ័ណ្ឌ
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          បញ្ចូល Email និង Password ដើម្បីចូលប្រើប្រាស់ និងរក្សាទុកពិន្ទុរបស់អ្នក
        </p>
      </div>

      <!-- Google Connect Button -->
      <button type="button" class="btn-google-auth" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--radius-md); background: #ffffff; border: 1.5px solid #dadce0; color: #3c4043; font-weight: 600; font-size: 0.92rem; box-shadow: 0 1px 3px rgba(60,64,67,0.15); transition: all var(--transition-fast); margin-bottom: 1.25rem; cursor: pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>ភ្ជាប់ជាមួយ Google (Connect with Google)</span>
      </button>

      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <hr style="flex: 1; border: none; border-top: 1px solid var(--border-color);" />
        <span style="font-size: 0.8rem; color: var(--text-muted);">ឬចូលតាមរយៈ Email</span>
        <hr style="flex: 1; border: none; border-top: 1px solid var(--border-color);" />
      </div>

      <form id="login-form">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Email ឬ គណនី</label>
          <div style="position: relative;">
            <span style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: inline-flex; align-items: center;">
              ${getIcon('mail')}
            </span>
            <input type="text" id="auth-email" class="form-input" placeholder="បញ្ចូល Email របស់អ្នក" style="padding-left: 2.5rem;" required autofocus />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
            <label class="form-label">ពាក្យសម្ងាត់ (Password)</label>
          </div>
          <div style="position: relative;">
            <span style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: inline-flex; align-items: center;">
              ${getIcon('lock')}
            </span>
            <input type="password" id="auth-password" class="form-input" placeholder="បញ្ចូលពាក្យសម្ងាត់" style="padding-left: 2.5rem; padding-right: 2.5rem;" required />
            <button type="button" id="btn-toggle-pwd" style="position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: inline-flex; align-items: center; padding: 0.2rem; background: none; border: none; cursor: pointer;" title="បង្ហាញពាក្យសម្ងាត់">
              ${getIcon('eye')}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 0.75rem; font-size: 0.95rem;">
          <span>ចូលគណនី (Sign In)</span>
        </button>

      </form>
    `;
  }

  function renderRegisterForm() {
    return `
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <div style="width: 56px; height: 56px; border-radius: 16px; overflow: hidden; margin: 0 auto 0.65rem; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25); border: 2px solid rgba(217, 119, 6, 0.35);">
          <img src="./logo.jpg" onerror="this.onerror=null; this.src='logo.jpg';" alt="Triem Krobkhand Logo" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">
          ចុះឈ្មោះគណនីថ្មី
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          បង្កើតគណនីដើម្បីតាមដានដំណើរការត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋរបស់អ្នក
        </p>
      </div>

      <!-- Google Connect Button -->
      <button type="button" class="btn-google-auth" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--radius-md); background: #ffffff; border: 1.5px solid #dadce0; color: #3c4043; font-weight: 600; font-size: 0.92rem; box-shadow: 0 1px 3px rgba(60,64,67,0.15); transition: all var(--transition-fast); margin-bottom: 1.25rem; cursor: pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>ចុះឈ្មោះជាមួយ Google</span>
      </button>

      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <hr style="flex: 1; border: none; border-top: 1px solid var(--border-color);" />
        <span style="font-size: 0.8rem; color: var(--text-muted);">ឬបំពេញព័ត៌មានខាងក្រោម</span>
        <hr style="flex: 1; border: none; border-top: 1px solid var(--border-color);" />
      </div>

      <form id="register-form">
        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label class="form-label">ឈ្មោះពេញរបស់បេក្ខជន *</label>
          <input type="text" id="reg-name" class="form-input" placeholder="ឧ. កែវ សំណាង" required />
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label class="form-label">អាសយដ្ឋាន Email *</label>
          <input type="email" id="reg-email" class="form-input" placeholder="yourname@gmail.com" required />
        </div>

        <div class="form-group" style="margin-bottom: 0.85rem;">
          <label class="form-label">ពាក្យសម្ងាត់ (យ៉ាងតិច ៤ តួ) *</label>
          <input type="password" id="reg-password" class="form-input" placeholder="បង្កើតពាក្យសម្ងាត់" required />
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label">ក្រសួង ឬស្ថាប័នរដ្ឋគោលដៅ</label>
          <select id="reg-ministry" class="form-select">
            ${MINISTRIES.filter(m => m.id !== 'all').map(m => `
              <option value="${m.name}">${m.name}</option>
            `).join('')}
          </select>
        </div>

        <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 0.8rem; font-size: 1rem;">
          <span>ចុះឈ្មោះបង្កើតគណនី (Register)</span>
        </button>
      </form>
    `;
  }

  renderModal();
}
