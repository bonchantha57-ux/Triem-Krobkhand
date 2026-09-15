import { StorageService } from '../services/storage.js';
import { MINISTRIES } from '../data/defaultData.js';
import { getIcon } from '../utils/icons.js';

export function renderProfileView(container, showToast, openExamModal, navigateTo, triggerAuthModal) {
  let isEditing = false;
  const currentUser = StorageService.getCurrentUser();
  const profile = StorageService.getProfile();
  const results = StorageService.getQuizResults();
  const bookmarks = StorageService.getBookmarks();
  const allExams = StorageService.getExams();

  // If user is not logged in, show clean unauthenticated screen
  if (!currentUser) {
    container.innerHTML = `
      <div class="profile-wrapper">
        <div class="profile-hero-card" style="text-align: center; display: flex; flex-direction: column; align-items: center; padding: 2.5rem 1.5rem; border: 1.5px dashed var(--border-color); background: var(--bg-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); margin-bottom: 1.5rem;">
          <div style="width: 76px; height: 76px; border-radius: 50%; background: var(--bg-subtle); color: var(--text-muted); display: flex; align-items: center; justify-content: center; margin-bottom: 1.1rem; border: 2px dashed var(--border-color);">
            <span style="display: inline-flex; align-items: center; transform: scale(1.4);">${getIcon('user')}</span>
          </div>

          <div style="display: inline-block; padding: 0.25rem 0.85rem; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; background: #fef2f2; color: #dc2626; margin-bottom: 0.65rem;">
            គ្មានគណនី (No Account)
          </div>

          <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
            មិនទាន់មានគណនីក្នុងប្រព័ន្ធ
          </h2>

          <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 380px; margin: 0 auto 1.75rem; line-height: 1.55;">
            សូមចូលគណនី ឬបង្កើតគណនីថ្មី ដើម្បីតាមដានលទ្ធផលតេស្ត វិញ្ញាសាដែលបានរក្សាទុក និងព័ត៌មានបេក្ខជនរបស់អ្នក។
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 320px;">
            <button id="btn-profile-login" class="btn-primary" style="justify-content: center; padding: 0.7rem 1.25rem; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.45rem; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
              ${getIcon('user')} <span>ចូលគណនី (Login)</span>
            </button>
            <button id="btn-profile-register" class="btn-secondary" style="justify-content: center; padding: 0.7rem 1.25rem; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.45rem; color: var(--text-primary); border-color: var(--border-color); background: var(--bg-surface);">
              <span>បង្កើតគណនីថ្មី (Create Account)</span>
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-profile-login')?.addEventListener('click', () => {
      if (triggerAuthModal) {
        triggerAuthModal('login');
      } else {
        document.getElementById('btn-auth-access')?.click();
      }
    });

    container.querySelector('#btn-profile-register')?.addEventListener('click', () => {
      if (triggerAuthModal) {
        triggerAuthModal('register');
      } else {
        document.getElementById('btn-auth-access')?.click();
      }
    });

    return;
  }

  const bookmarkedExams = allExams.filter(e => bookmarks.includes(e.id));
  const totalTests = results.length;
  const passedTests = results.filter(r => (r.percentage || 0) >= 50).length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  const highestScore = totalTests > 0 ? Math.max(...results.map(r => r.percentage || 0)) : 0;

  function render() {
    container.innerHTML = `
      <div class="profile-wrapper">
        <!-- Compact Profile Hero Card -->
        <div class="profile-hero-card">
          <div class="profile-avatar-box">
            <div class="profile-avatar">
              ${getIcon('user')}
            </div>
            <div class="profile-avatar-badge" title="គណនីសកម្ម"></div>
          </div>

          <div class="profile-info">
            <div class="profile-name-row">
              <div class="profile-name-group">
                <h2 class="profile-name">${currentUser.name || profile.name || 'បេក្ខជន'}</h2>
                <span class="profile-role-tag" style="background: ${currentUser.role === 'admin' ? '#fef3c7' : 'var(--primary-50)'}; color: ${currentUser.role === 'admin' ? '#b45309' : 'var(--primary-700)'};">
                  ${currentUser.role === 'admin' ? 'រដ្ឋបាល (Admin)' : (currentUser.provider === 'google' ? 'Google Account' : 'បេក្ខជន')}
                </span>
              </div>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <button id="btn-toggle-edit-profile" class="btn-profile-edit" title="កែប្រែព័ត៌មាន">
                  ${isEditing ? `${getIcon('x')} <span>បិទ</span>` : `${getIcon('edit')} <span>កែប្រែ</span>`}
                </button>
                <button id="btn-profile-logout" class="btn-profile-edit" style="color: var(--danger-600); border-color: rgba(239, 68, 68, 0.3);" title="ចាកចេញពីគណនី">
                  ${getIcon('logout')} <span>ចាកចេញ</span>
                </button>
              </div>
            </div>
            <div class="profile-chips-row">
              <span class="profile-chip" title="Email">
                <span>${currentUser.email || 'គ្មាន Email'}</span>
              </span>
              <span class="profile-chip target" title="ស្ថាប័នគោលដៅ">
                ${getIcon('building')}
                <span>${profile.targetMinistry || 'សាលាភូមិន្ទរដ្ឋបាល (ERA)'}</span>
              </span>
              <span class="profile-chip" title="ឆ្នាំប្រឡង">
                ${getIcon('calendar')}
                <span>ឆ្នាំ ${profile.targetYear || '២០២៥-២០២៦'}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Edit Profile Form (conditional) -->
        ${isEditing ? `
          <div class="profile-section-card" style="border-left: 3.5px solid var(--primary-600);">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.85rem; color: var(--text-primary);">កែប្រែព័ត៌មានបេក្ខជន</h4>
            <div class="form-row cols-2" style="margin-bottom: 0.75rem;">
              <div class="form-group">
                <label class="form-label" style="font-size: 0.82rem;">ឈ្មោះបេក្ខជន</label>
                <input type="text" id="edit-name" class="form-input" style="padding: 0.5rem 0.75rem; font-size: 0.88rem;" value="${profile.name || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size: 0.82rem;">ស្ថាប័នគោលដៅ</label>
                <select id="edit-ministry" class="form-select" style="padding: 0.5rem 0.75rem; font-size: 0.88rem;">
                  ${MINISTRIES.filter(m => m.id !== 'all').map(m => `
                    <option value="${m.name}" ${profile.targetMinistry === m.name ? 'selected' : ''}>${m.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 0.85rem;">
              <label class="form-label" style="font-size: 0.82rem;">ឆ្នាំប្រឡងគ្រោងទុក</label>
              <input type="text" id="edit-year" class="form-input" style="padding: 0.5rem 0.75rem; font-size: 0.88rem;" value="${profile.targetYear || '២០២៥-២០២៦'}" />
            </div>
            <button id="btn-save-profile" class="btn-primary" style="padding: 0.45rem 1.1rem; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('save')} <span>រក្សាទុក</span>
            </button>
          </div>
        ` : ''}

        <!-- Compact Performance Stats Overview -->
        <div class="profile-stats-grid">
          <div class="profile-stat-card">
            <div class="profile-stat-icon" style="background: #eff6ff; color: #2563eb;">
              ${getIcon('barChart')}
            </div>
            <div>
              <div class="profile-stat-val">${totalTests}</div>
              <div class="profile-stat-lbl">តេស្តបានធ្វើ</div>
            </div>
          </div>

          <div class="profile-stat-card">
            <div class="profile-stat-icon" style="background: #ecfdf5; color: #059669;">
              ${getIcon('checkCircle')}
            </div>
            <div>
              <div class="profile-stat-val">${passRate}%</div>
              <div class="profile-stat-lbl">អត្រាជាប់</div>
            </div>
          </div>

          <div class="profile-stat-card">
            <div class="profile-stat-icon" style="background: #fef3c7; color: #d97706;">
              ${getIcon('award')}
            </div>
            <div>
              <div class="profile-stat-val">${highestScore}%</div>
              <div class="profile-stat-lbl">ពិន្ទុខ្ពស់បំផុត</div>
            </div>
          </div>

          <div class="profile-stat-card">
            <div class="profile-stat-icon" style="background: #f5f3ff; color: #7c3aed;">
              ${getIcon('starFilled')}
            </div>
            <div>
              <div class="profile-stat-val">${bookmarkedExams.length}</div>
              <div class="profile-stat-lbl">វិញ្ញាសារក្សាទុក</div>
            </div>
          </div>
        </div>

        <!-- Bookmarked Exams Section -->
        <div class="profile-section-card">
          <div class="profile-section-title">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span style="color: #f59e0b; display: inline-flex; align-items: center;">${getIcon('starFilled')}</span>
              <span>វិញ្ញាសាដែលបានរក្សាទុក (${bookmarkedExams.length})</span>
            </div>
          </div>

          ${bookmarkedExams.length === 0 ? `
            <p style="font-size: 0.84rem; color: var(--text-muted); text-align: center; padding: 1.25rem 0;">
              មិនទាន់មានវិញ្ញាសាណាមួយត្រូវបានរក្សាទុកនៅឡើយទេ។ ចុចផ្កាយលើវិញ្ញាសាដើម្បីរក្សាទុកនៅទីនេះ។
            </p>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${bookmarkedExams.map(ex => `
                <div class="profile-item-row profile-exam-row" data-id="${ex.id}" style="cursor: pointer; display: flex; align-items: center;">
                  ${ex.imageUrl ? `
                    <div style="width: 44px; height: 38px; display: flex; align-items: center; justify-content: center; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-color); overflow: hidden; padding: 2px; flex-shrink: 0; margin-right: 0.65rem;">
                      <img src="${ex.imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="" />
                    </div>
                  ` : ''}
                  <div class="profile-item-info">
                    <h4 class="profile-item-title">${ex.title}</h4>
                    <div class="profile-item-sub">${ex.ministryName || 'ក្របខ័ណ្ឌរដ្ឋ'} • ឆ្នាំ ${ex.year || '2024'}</div>
                  </div>
                  <button class="btn-read-bookmarked btn-read-compact" data-id="${ex.id}">អាន</button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Test History List -->
        <div class="profile-section-card">
          <div class="profile-section-title">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('fileText')}</span>
              <span>ប្រវត្តិធ្វើតេស្តសាកល្បង (${results.length})</span>
            </div>
            ${totalTests > 0 ? `
              <button id="btn-clear-history" style="font-size: 0.74rem; color: var(--danger-600); background: none; border: none; font-weight: 600; cursor: pointer; padding: 0.2rem 0.4rem;">
                លុបប្រវត្តិ
              </button>
            ` : ''}
          </div>

          ${results.length === 0 ? `
            <div style="text-align: center; padding: 1.25rem 0;">
              <p style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 0.65rem;">
                អ្នកមិនទាន់បានធ្វើតេស្តសាកល្បងណាមួយនៅឡើយទេ។
              </p>
              <button id="btn-profile-take-quiz" class="btn-primary" style="padding: 0.4rem 1rem; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                ${getIcon('timer')} <span>ចាប់ផ្តើមធ្វើតេស្ត</span>
              </button>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${results.slice(0, 10).map((res, i) => {
                const passed = (res.percentage || 0) >= 50;
                const dateStr = res.date ? new Date(res.date).toLocaleDateString('km-KH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                return `
                  <div class="profile-item-row" style="border-left: 3.5px solid ${passed ? 'var(--success-500)' : 'var(--danger-500)'};">
                    <div class="profile-item-info">
                      <div class="profile-item-title">
                        តេស្តលើកទី ${totalTests - i}
                      </div>
                      <div class="profile-item-sub">
                        ${dateStr} • ត្រូវ ${res.score}/${res.totalQuestions} សំណួរ
                      </div>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                      <div style="font-family: var(--font-family-numbers); font-size: 1.05rem; font-weight: 700; color: ${passed ? 'var(--success-600)' : 'var(--danger-600)'}; line-height: 1.2;">
                        ${res.percentage}%
                      </div>
                      <span style="font-size: 0.7rem; font-weight: 700; color: ${passed ? 'var(--success-600)' : 'var(--danger-600)'}; display: inline-flex; align-items: center; gap: 0.15rem;">
                        ${passed ? `${getIcon('check')} <span>ជាប់</span>` : `${getIcon('x')} <span>ធ្លាក់</span>`}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Developer Note -->
        <div style="text-align: center; padding: 1rem 0; font-size: 0.82rem; color: var(--text-muted);">
          កម្មវិធីបង្កើត និងអភិវឌ្ឍដោយ៖ <strong style="color: var(--primary-600);">BORN CHANTHA</strong>
        </div>
      </div>
    `;

    // Toggle edit
    container.querySelector('#btn-toggle-edit-profile')?.addEventListener('click', () => {
      isEditing = !isEditing;
      render();
    });

    // Logout from profile
    container.querySelector('#btn-profile-logout')?.addEventListener('click', () => {
      StorageService.logout();
      showToast('បានចាកចេញពីគណនីដោយជោគជ័យ', 'info');
      if (typeof window.refreshAppAuthUI === 'function') {
        window.refreshAppAuthUI();
      }
      renderProfileView(container, showToast, openExamModal, navigateTo, triggerAuthModal);
    });

    // Save profile
    container.querySelector('#btn-save-profile')?.addEventListener('click', () => {
      const name = container.querySelector('#edit-name').value.trim();
      const ministry = container.querySelector('#edit-ministry').value;
      const year = container.querySelector('#edit-year').value.trim();
      StorageService.saveProfile({ name, targetMinistry: ministry, targetYear: year });
      showToast('បានរក្សាទុកព័ត៌មានបេក្ខជនរួចរាល់!', 'success');
      isEditing = false;
      render();
    });

    // Clear history
    container.querySelector('#btn-clear-history')?.addEventListener('click', () => {
      if (confirm('តើអ្នកពិតជាចង់លុបប្រវត្តិធ្វើតេស្តទាំងអស់មែនទេ?')) {
        localStorage.setItem('triem_quiz_results_v1', JSON.stringify([]));
        showToast('បានលុបប្រវត្តិរួចរាល់', 'success');
        render();
      }
    });

    // Read bookmarked exam
    container.querySelectorAll('.profile-exam-row').forEach(row => {
      row.addEventListener('click', () => {
        const ex = allExams.find(x => x.id === row.dataset.id);
        if (ex) openExamModal(ex);
      });
    });

    container.querySelectorAll('.btn-read-bookmarked').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ex = allExams.find(x => x.id === btn.dataset.id);
        if (ex) openExamModal(ex);
      });
    });

    // Start quiz from profile
    container.querySelector('#btn-profile-take-quiz')?.addEventListener('click', () => navigateTo('quiz'));
  }

  render();
}
