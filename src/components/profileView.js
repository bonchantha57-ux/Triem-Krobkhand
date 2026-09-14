import { StorageService } from '../services/storage.js';
import { MINISTRIES } from '../data/defaultData.js';
import { getIcon } from '../utils/icons.js';

export function renderProfileView(container, showToast, openExamModal, navigateTo) {
  let isEditing = false;
  const profile = StorageService.getProfile();
  const results = StorageService.getQuizResults();
  const bookmarks = StorageService.getBookmarks();
  const allExams = StorageService.getExams();

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
                <h2 class="profile-name">${profile.name || 'បេក្ខជនត្រៀមប្រឡង'}</h2>
                <span class="profile-role-tag">បេក្ខជន</span>
              </div>
              <button id="btn-toggle-edit-profile" class="btn-profile-edit" title="កែប្រែព័ត៌មាន">
                ${isEditing ? `${getIcon('x')} <span>បិទ</span>` : `${getIcon('edit')} <span>កែប្រែ</span>`}
              </button>
            </div>
            <div class="profile-chips-row">
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
                <div class="profile-item-row">
                  <div class="profile-item-info">
                    <h4 class="profile-item-title">${ex.title}</h4>
                    <div class="profile-item-sub">${ex.ministryName} • ឆ្នាំ ${ex.year}</div>
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
      </div>
    `;

    // Toggle edit
    container.querySelector('#btn-toggle-edit-profile')?.addEventListener('click', () => {
      isEditing = !isEditing;
      render();
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
    container.querySelectorAll('.btn-read-bookmarked').forEach(btn => {
      btn.addEventListener('click', () => {
        const ex = allExams.find(x => x.id === btn.dataset.id);
        if (ex) openExamModal(ex);
      });
    });

    // Start quiz from profile
    container.querySelector('#btn-profile-take-quiz')?.addEventListener('click', () => navigateTo('quiz'));
  }

  render();
}
