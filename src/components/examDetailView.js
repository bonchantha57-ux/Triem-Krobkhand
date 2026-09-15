import { StorageService } from '../services/storage.js';
import { getIcon } from '../utils/icons.js';

/**
 * Render dedicated Full-Page Exam Reader View
 * @param {HTMLElement} container - Main view container
 * @param {string} examId - ID of the exam to display
 * @param {Function} navigateTo - Router navigation function
 * @param {Function} showToast - Toast notification function
 */
export function renderExamDetailView(container, examId, navigateTo, showToast) {
  const allExams = StorageService.getExams();
  const exam = allExams.find(x => x.id === examId) || allExams[0];

  if (!exam) {
    container.innerHTML = `
      <div class="exam-detail-page" style="text-align: center; padding: 4rem 1rem;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--bg-subtle); color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
          ${getIcon('fileText')}
        </div>
        <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">រកមិនឃើញវិញ្ញាសានេះទេ</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">វិញ្ញាសាដែលអ្នកស្វែងរកប្រហែលជាត្រូវបានកែសម្រួល ឬលុបចេញ។</p>
        <button class="btn-primary" id="btn-err-back" style="display: inline-flex; align-items: center; gap: 0.4rem; margin: 0 auto;">
          ${getIcon('arrowLeft')} <span>ត្រឡប់ទៅបណ្ណាល័យវិញ្ញាសា</span>
        </button>
      </div>
    `;
    container.querySelector('#btn-err-back')?.addEventListener('click', () => navigateTo('exams'));
    return;
  }

  let currentFontSize = 16;
  const isBookmarked = StorageService.isBookmarked(exam.id);

  container.innerHTML = `
    <div class="exam-detail-page">
      <!-- Top Navigation & Controls Bar -->
      <div class="exam-detail-nav-bar">
        <button class="btn-detail-back" id="btn-back-detail" title="ត្រឡប់ទៅបណ្ណាល័យ">
          <span style="display: inline-flex; align-items: center;">${getIcon('arrowLeft')}</span>
          <span>ត្រឡប់ក្រោយ</span>
        </button>

        <div class="exam-detail-toolbar">
          <span class="toolbar-label">ពង្រីកអក្សរ៖</span>
          <button class="icon-btn" id="btn-detail-zoom-out" style="width: 32px; height: 32px; font-size: 0.8rem; font-weight: bold;" title="បង្រួមអក្សរ">A-</button>
          <button class="icon-btn" id="btn-detail-zoom-in" style="width: 32px; height: 32px; font-size: 0.8rem; font-weight: bold;" title="ពង្រីកអក្សរ">A+</button>
          <button class="icon-btn" id="btn-detail-bookmark" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;" title="រក្សាទុកក្នុង Profile">
            ${isBookmarked ? getIcon('starFilled') : getIcon('star')}
          </button>
          <button class="icon-btn" id="btn-detail-print" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;" title="បោះពុម្ពវិញ្ញាសា / Print">
            ${getIcon('printer')}
          </button>
          <button class="icon-btn" id="btn-detail-share" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;" title="ចែករំលែកវិញ្ញាសា">
            ${getIcon('share')}
          </button>
        </div>
      </div>

      <!-- Header Card with Metadata & Breadcrumbs -->
      <div class="exam-detail-header-card">
        <div class="exam-detail-breadcrumbs">
          <span class="bc-link" id="bc-home">ទំព័រដើម</span>
          <span>/</span>
          <span class="bc-link" id="bc-library">បណ្ណាល័យវិញ្ញាសា</span>
          <span>/</span>
          <span style="color: var(--text-primary); font-weight: 500;">${exam.title}</span>
        </div>

        <div class="exam-detail-badges">
          <span class="exam-badge" style="font-size: 0.82rem; padding: 0.35rem 0.8rem;">
            ${exam.ministryName || 'ក្របខ័ណ្ឌរដ្ឋ'}
          </span>
          <span class="exam-badge" style="font-size: 0.82rem; padding: 0.35rem 0.8rem; background: var(--bg-subtle); color: var(--text-secondary); border: 1px solid var(--border-color);">
            វិញ្ញាសារួមគ្រប់ឆ្នាំ
          </span>
        </div>

        <h1 class="exam-detail-title">${exam.title}</h1>

        <div class="exam-detail-meta-row">
          <div class="exam-detail-meta-item">
            <span style="color: var(--primary-600); display: inline-flex;">${getIcon('building')}</span>
            <span>ស្ថាប័ន / ក្រសួង៖ <strong>${exam.ministryName || 'ក្របខ័ណ្ឌរដ្ឋ'}</strong></span>
          </div>
          <div class="exam-detail-meta-item">
            <span style="color: var(--primary-600); display: inline-flex;">${getIcon('fileText')}</span>
            <span>ឯកសារ៖ <strong>វិញ្ញាសាពាក់ព័ន្ធគ្រប់ឆ្នាំចូលគ្នាតែមួយ</strong></span>
          </div>
        </div>
      </div>

      <!-- Emblem / Document Image (Completely Uncropped & Fully Displayed) -->
      ${exam.imageUrl ? `
        <div class="exam-detail-cover-container">
          <img src="${exam.imageUrl}" alt="${exam.title}" class="exam-detail-cover-img" loading="eager" />
        </div>
      ` : ''}

      <!-- Summary Card -->
      ${exam.description ? `
        <div class="exam-detail-summary-card">
          <strong style="color: var(--primary-600); display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.95rem;">
            ${getIcon('fileText')} សេចក្តីសង្ខេបវិញ្ញាសា៖
          </strong>
          <p style="margin-top: 0.4rem; color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">
            ${exam.description}
          </p>
        </div>
      ` : ''}

      <!-- Main Exam Content Card -->
      <div class="exam-detail-content-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--primary-600); display: inline-flex; align-items: center; gap: 0.45rem;">
            ${getIcon('book')}
            <span>ខ្លឹមសារវិញ្ញាសាទាំងមូល</span>
          </h3>
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
            ទំហំអក្សរ៖ <span id="lbl-font-size">${currentFontSize}px</span>
          </span>
        </div>

        <div class="exam-detail-text-body" id="exam-detail-text-body" style="font-size: ${currentFontSize}px;">
          ${exam.content}
        </div>
      </div>

      <!-- Bottom Action Bar -->
      <div class="exam-detail-bottom-actions">
        <button class="btn-secondary" id="btn-bottom-back" style="color: var(--text-primary); border-color: var(--border-color); display: inline-flex; align-items: center; gap: 0.4rem;">
          ${getIcon('arrowLeft')}
          <span>ត្រឡប់ទៅបណ្ណាល័យវិញ</span>
        </button>

        <button class="btn-primary" id="btn-start-quiz-cta" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.6rem; font-size: 0.98rem; font-weight: 700; border-radius: var(--radius-full);">
          ${getIcon('timer')}
          <span>ទៅធ្វើតេស្តសាកល្បងឥឡូវនេះ</span>
        </button>
      </div>

      <!-- Developer Credit Note -->
      <div style="text-align: center; margin-top: 1.75rem; padding: 0.75rem; color: var(--text-muted); font-size: 0.82rem;">
        កម្មវិធី និងវិញ្ញាសាត្រូវបានរៀបចំអភិវឌ្ឍដោយ៖ <strong style="color: var(--primary-600);">BORN CHANTHA</strong>
      </div>
    </div>
  `;

  // --- Attach Event Listeners ---
  const goBack = () => navigateTo('exams');

  container.querySelector('#btn-back-detail')?.addEventListener('click', goBack);
  container.querySelector('#btn-bottom-back')?.addEventListener('click', goBack);
  container.querySelector('#bc-home')?.addEventListener('click', () => navigateTo('home'));
  container.querySelector('#bc-library')?.addEventListener('click', () => navigateTo('exams'));

  // Zoom In / Zoom Out
  const textBody = container.querySelector('#exam-detail-text-body');
  const lblFontSize = container.querySelector('#lbl-font-size');

  container.querySelector('#btn-detail-zoom-in')?.addEventListener('click', () => {
    if (currentFontSize < 28) {
      currentFontSize += 2;
      textBody.style.fontSize = `${currentFontSize}px`;
      if (lblFontSize) lblFontSize.textContent = `${currentFontSize}px`;
    }
  });

  container.querySelector('#btn-detail-zoom-out')?.addEventListener('click', () => {
    if (currentFontSize > 12) {
      currentFontSize -= 2;
      textBody.style.fontSize = `${currentFontSize}px`;
      if (lblFontSize) lblFontSize.textContent = `${currentFontSize}px`;
    }
  });

  // Bookmark Toggle
  const bmBtn = container.querySelector('#btn-detail-bookmark');
  bmBtn?.addEventListener('click', () => {
    const state = StorageService.toggleBookmark(exam.id);
    bmBtn.innerHTML = state ? getIcon('starFilled') : getIcon('star');
    showToast(state ? 'បានរក្សាទុកវិញ្ញាសានេះ!' : 'បានដកចេញពីបញ្ជីរក្សាទុក');
  });

  // Print
  container.querySelector('#btn-detail-print')?.addEventListener('click', () => {
    window.print();
  });

  // Share Link
  container.querySelector('#btn-detail-share')?.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('បានចម្លងតំណភ្ជាប់ (Link) វិញ្ញាសានេះរួចរាល់!');
      }).catch(() => {
        showToast('វិញ្ញាសា៖ ' + exam.title);
      });
    } else {
      showToast('វិញ្ញាសា៖ ' + exam.title);
    }
  });

  // Start Practice Quiz
  container.querySelector('#btn-start-quiz-cta')?.addEventListener('click', () => {
    navigateTo('quiz', { examId: exam.id, ministry: exam.ministryId });
  });
}
