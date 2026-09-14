import { StorageService } from '../services/storage.js';
import { getIcon } from '../utils/icons.js';

export function renderSettingsView(container, showToast, refreshApp) {
  const settings = StorageService.getSettings();

  container.innerHTML = `
    <div style="max-width: 680px; margin: 0 auto;">
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.4rem;">
          <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('settings')}</span>
          <span>ការកំណត់ (Settings)</span>
        </h2>
        <p style="font-size: 0.88rem; color: var(--text-muted);">
          កំណត់រចនាប័ទ្មពណ៌ ទំហំអក្សរ និងបទពិសោធន៍ប្រើប្រាស់
        </p>
      </div>

      <!-- 1. Appearance & Display -->
      <div class="admin-form-card" style="margin-bottom: 1.25rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('palette')}</span>
          <span>រូបរាង និងការបង្ហាញ (Appearance)</span>
        </h3>

        <!-- Dark / Light Theme -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">រូបរាង (Theme Mode)</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">ជ្រើសរើសរវាងពណ៌ភ្លឺ ឬពណ៌ងងឹត</div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <button id="btn-theme-light" class="selector-btn ${settings.theme === 'light' ? 'selected' : ''}" style="padding: 0.45rem 0.9rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('sun')} <span>ភ្លឺ</span>
            </button>
            <button id="btn-theme-dark" class="selector-btn ${settings.theme === 'dark' ? 'selected' : ''}" style="padding: 0.45rem 0.9rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('moon')} <span>ងងឹត</span>
            </button>
          </div>
        </div>

        <!-- Font Size Adjuster -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">ទំហំអក្សរខ្មែរ (Font Size)</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">កែសម្រួលទំហំអក្សរឱ្យងាយស្រួលអាន</div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-font-size selector-btn ${settings.fontSize === 'small' ? 'selected' : ''}" data-size="small" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;">តូច</button>
            <button class="btn-font-size selector-btn ${settings.fontSize === 'medium' ? 'selected' : ''}" data-size="medium" style="padding: 0.4rem 0.75rem; font-size: 0.88rem;">មធ្យម</button>
            <button class="btn-font-size selector-btn ${settings.fontSize === 'large' ? 'selected' : ''}" data-size="large" style="padding: 0.4rem 0.75rem; font-size: 0.95rem;">ធំ</button>
          </div>
        </div>

        <!-- Sound Toggle -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">សម្លេង (Sound Effects)</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">សម្លេងពេលឆ្លើយសំណួរត្រូវ ឬខុស</div>
          </div>
          <div>
            <button id="btn-toggle-sound" class="selector-btn ${settings.sound !== false ? 'selected' : ''}" style="padding: 0.4rem 0.85rem; font-size: 0.85rem;">
              ${settings.sound !== false ? 'បើក (On)' : 'បិទ (Off)'}
            </button>
          </div>
        </div>
      </div>

      <!-- 2. App Info & Civil Service Resources -->
      <div class="admin-form-card">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('building')}</span>
          <span>អំពីកម្មវិធី Triem Krobkhand</span>
        </h3>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.75rem;">
          <strong>Triem Krobkhand</strong> (ត្រៀមក្របខ័ណ្ឌ) ត្រូវបានបង្កើតឡើងជាពិសេសសម្រាប់ជួយសម្រួលដល់បេក្ខជនទាំងអស់ក្នុងការត្រៀមខ្លួនសម្រាប់ការប្រឡងចូលបម្រើការងារក្នុងក្របខ័ណ្ឌរាជការស៊ីវិលនៃព្រះរាជាណាចក្រកម្ពុជា។
        </p>
        <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
          <span>កំណែទម្រង់បច្ចុប្បន្ន៖ v1.0.0</span>
          <span style="color: var(--success-600); display: inline-flex; align-items: center; gap: 0.3rem;">
            ${getIcon('checkCircle')} ប្រព័ន្ធដំណើរការប្រក្រតី
          </span>
        </div>
      </div>
    </div>
  `;

  // Theme click
  container.querySelector('#btn-theme-light')?.addEventListener('click', () => {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    StorageService.saveSettings({ theme: 'light' });
    renderSettingsView(container, showToast, refreshApp);
  });

  container.querySelector('#btn-theme-dark')?.addEventListener('click', () => {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    StorageService.saveSettings({ theme: 'dark' });
    renderSettingsView(container, showToast, refreshApp);
  });

  // Font size
  container.querySelectorAll('.btn-font-size').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      document.body.classList.remove('font-small', 'font-medium', 'font-large');
      document.body.classList.add(`font-${size}`);
      StorageService.saveSettings({ fontSize: size });
      renderSettingsView(container, showToast, refreshApp);
    });
  });

  // Sound toggle
  container.querySelector('#btn-toggle-sound')?.addEventListener('click', () => {
    const currentSound = settings.sound !== false;
    StorageService.saveSettings({ sound: !currentSound });
    renderSettingsView(container, showToast, refreshApp);
  });
}
