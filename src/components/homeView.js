import { MINISTRIES, CATEGORIES } from '../data/defaultData.js';
import { StorageService } from '../services/storage.js';
import { getIcon } from '../utils/icons.js';

export function renderHomeView(container, navigateTo, openExamModal) {
  const exams = StorageService.getExams();
  const questions = StorageService.getQuestions();
  const results = StorageService.getQuizResults();
  const profile = StorageService.getProfile();

  // Calculate statistics
  const totalTests = results.length;
  const avgScore = totalTests > 0 
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalTests)
    : 0;
  const passedTests = results.filter(r => (r.percentage || 0) >= 50).length;

  const activeMinistries = StorageService.getActiveMinistries();

  // Question of the day (deterministic based on day of year, if questions exist)
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const dailyQuestion = questions.length > 0 ? (questions[dayOfYear % questions.length] || questions[0]) : null;

  container.innerHTML = `
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-content">
        <div class="hero-badge">
          <span style="display: inline-flex; align-items: center;">${getIcon('sparkles')}</span>
          <span>ត្រៀមប្រឡងក្របខ័ណ្ឌរដ្ឋកម្ពុជា ២០២៥-២០២៦</span>
        </div>
        <h2 class="hero-title">ស្វាគមន៍មកកាន់ Triem Krobkhand</h2>
        <p class="hero-desc">
          ថ្នាលហ្វឹកហាត់វិញ្ញាសា និងតេស្តសាកល្បងតាមស្តង់ដារក្រសួងស្ថាប័នរដ្ឋ (ERA, MEF, គយ, ពន្ធដារ, មហាផ្ទៃ...) ដើម្បីជោគជ័យក្នុងការប្រឡងក្លាយជាមន្ត្រីរាជការស៊ីវិល។
        </p>
        <div class="hero-actions">
          <button id="btn-hero-start-quiz" class="btn-primary">
            <span style="display: inline-flex; align-items: center;">${getIcon('timer')}</span>
            <span>ចាប់ផ្តើមធ្វើតេស្តសាកល្បង</span>
          </button>
          <button id="btn-hero-view-exams" class="btn-secondary">
            <span style="display: inline-flex; align-items: center;">${getIcon('book')}</span>
            <span>មើលបណ្ណាល័យវិញ្ញាសា</span>
          </button>
        </div>
      </div>
      <div class="hero-emblem-badge" title="Triem Krobkhand Official Logo">
        <img src="./logo.jpg" onerror="this.onerror=null; this.src='logo.jpg';" alt="Triem Krobkhand Logo" class="hero-emblem-img" />
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: #eff6ff; color: #2563eb;">
          <span style="display: inline-flex; align-items: center;">${getIcon('book')}</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">${exams.length}</span>
          <span class="stat-label">វិញ្ញាសាត្រៀម</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fef3c7; color: #d97706;">
          <span style="display: inline-flex; align-items: center;">${getIcon('helpCircle')}</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">${questions.length}</span>
          <span class="stat-label">សំណួរតេស្តសរុប</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #ecfdf5; color: #059669;">
          <span style="display: inline-flex; align-items: center;">${getIcon('award')}</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">${totalTests}</span>
          <span class="stat-label">លើកដែលបានតេស្ត</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f5f3ff; color: #7c3aed;">
          <span style="display: inline-flex; align-items: center;">${getIcon('trendUp')}</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">${avgScore}%</span>
          <span class="stat-label">ពិន្ទុមធ្យម</span>
        </div>
      </div>
    </div>

    <!-- Ministry Selector -->
    <div class="section-header">
      <h3 class="section-title">
        <span style="display: inline-flex; align-items: center; color: var(--primary-600);">${getIcon('building')}</span>
        <span>ជ្រើសរើសតាមក្រសួង/ស្ថាប័នរដ្ឋ</span>
      </h3>
      ${activeMinistries.length > 0 ? `<button class="section-link" id="link-all-ministries">មើលទាំងអស់</button>` : ''}
    </div>

    ${activeMinistries.length > 0 ? `
      <div class="ministry-grid" id="ministry-grid">
        ${activeMinistries.map(m => `
          <div class="ministry-card" data-ministry="${m.id}" title="${m.name}">
            <span class="m-icon" style="display: inline-flex; align-items: center; justify-content: center; color: var(--primary-600);">${getIcon('building')}</span>
            <span class="m-name">${m.name}</span>
          </div>
        `).join('')}
      </div>
    ` : `
      <div style="text-align: center; padding: 1.75rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color); color: var(--text-muted); margin-bottom: 1.5rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: var(--bg-subtle); color: var(--primary-600); margin-bottom: 0.4rem;">${getIcon('building')}</span>
        <p style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.2rem;">មិនទាន់មានស្ថាប័ន/ក្រសួងនៅឡើយទេ</p>
        <p style="font-size: 0.82rem;">ស្ថាប័ន និងក្រសួងនឹងបង្ហាញនៅទីនេះ ពេល Admin ចាប់ផ្តើមបញ្ចូលវិញ្ញាសាថ្មី។</p>
      </div>
    `}

    <!-- Daily Challenge Card -->
    ${dailyQuestion ? `
      <div class="admin-form-card" style="border-left: 4px solid var(--primary-600); margin-bottom: 1.75rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <span class="exam-badge" style="background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('zap')} សំណួរប្រចាំថ្ងៃ
          </span>
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">កម្រិត៖ ${dailyQuestion.difficulty || 'មធ្យម'}</span>
        </div>
        <p style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem; line-height: 1.5;">
          ${dailyQuestion.question}
        </p>
        <div id="daily-question-choices" class="choices-list" style="margin-bottom: 0.75rem;">
          ${dailyQuestion.options.map((opt, idx) => `
            <div class="choice-item" data-idx="${idx}">
              <span class="choice-letter">${['ក', 'ខ', 'គ', 'ឃ'][idx] || (idx + 1)}</span>
              <span class="choice-text">${opt}</span>
            </div>
          `).join('')}
        </div>
        <div id="daily-explanation" style="display: none; padding: 0.85rem; border-radius: var(--radius-md); background: var(--bg-subtle); font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
          <strong style="color: var(--primary-600); display: inline-flex; align-items: center; gap: 0.3rem;">${getIcon('bulb')} ការពន្យល់៖</strong> ${dailyQuestion.explanation || 'គ្មានការពន្យល់'}
        </div>
      </div>
    ` : ''}

    <!-- Recent Exams Section -->
    <div class="section-header">
      <h3 class="section-title">
        <span style="display: inline-flex; align-items: center; color: var(--primary-600);">${getIcon('fileText')}</span>
        <span>វិញ្ញាសាប្រឡងចុងក្រោយ</span>
      </h3>
      ${exams.length > 0 ? `<button class="section-link" id="link-all-exams">មើលវិញ្ញាសាទាំងអស់ (${exams.length})</button>` : ''}
    </div>

    ${exams.length > 0 ? `
      <div class="exams-grid">
        ${exams.slice(0, 3).map(exam => `
          <div class="exam-card" data-id="${exam.id}">
            <img class="exam-card-image" src="${exam.imageUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80'}" alt="${exam.title}" loading="lazy" />
            <div class="exam-card-content">
              <div class="exam-meta-bar">
                <span class="exam-badge">${exam.categoryName || 'វប្បធម៌ទូទៅ'}</span>
                <span class="exam-year">${exam.year || '2024'}</span>
              </div>
              <h4 class="exam-title">${exam.title}</h4>
              <p class="exam-desc">${exam.description || 'វិញ្ញាសាស្តង់ដារសម្រាប់ការប្រឡងចូលក្របខ័ណ្ឌរដ្ឋ'}</p>
              <div class="exam-footer">
                <span style="display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('timer')} ${exam.durationMinutes || 60} នាទី</span>
                <button class="exam-details-btn btn-read-exam" data-id="${exam.id}">អានវិញ្ញាសា</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div style="text-align: center; padding: 2.5rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color); color: var(--text-muted); margin-bottom: 2rem;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: var(--bg-subtle); color: var(--primary-600); margin-bottom: 0.5rem;">${getIcon('book')}</span>
        <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem;">មិនទាន់មានវិញ្ញាសាប្រឡងនៅឡើយទេ</h4>
        <p style="font-size: 0.85rem; max-width: 320px; margin: 0 auto;">វិញ្ញាសាប្រឡងនឹងបង្ហាញនៅទីនេះ ពេល Admin ចាប់ផ្តើមបញ្ចូលវិញ្ញាសាថ្មី។</p>
      </div>
    `}
  `;

  // Attach Event Handlers
  container.querySelector('#btn-hero-start-quiz')?.addEventListener('click', () => navigateTo('quiz'));
  container.querySelector('#btn-hero-view-exams')?.addEventListener('click', () => navigateTo('exams'));
  container.querySelector('#link-all-exams')?.addEventListener('click', () => navigateTo('exams'));
  container.querySelector('#link-all-ministries')?.addEventListener('click', () => navigateTo('exams'));

  // Ministry clicks
  container.querySelectorAll('.ministry-card').forEach(card => {
    card.addEventListener('click', () => {
      const ministry = card.dataset.ministry;
      navigateTo('exams', { ministry });
    });
  });

  // Read exam buttons
  container.querySelectorAll('.btn-read-exam').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const examId = btn.dataset.id;
      const exam = exams.find(x => x.id === examId);
      if (exam) openExamModal(exam);
    });
  });

  // Daily Question interactivity
  if (dailyQuestion) {
    const choiceItems = container.querySelectorAll('#daily-question-choices .choice-item');
    const explDiv = container.querySelector('#daily-explanation');
    let answered = false;

    choiceItems.forEach(item => {
      item.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const selectedIdx = parseInt(item.dataset.idx, 10);
        const isCorrect = selectedIdx === dailyQuestion.correctAnswer;

        choiceItems.forEach((ci, idx) => {
          if (idx === dailyQuestion.correctAnswer) {
            ci.style.background = '#dcfce7';
            ci.style.borderColor = '#15803d';
            ci.querySelector('.choice-letter').style.background = '#15803d';
            ci.querySelector('.choice-letter').style.color = '#fff';
          } else if (idx === selectedIdx && !isCorrect) {
            ci.style.background = '#fee2e2';
            ci.style.borderColor = '#dc2626';
            ci.querySelector('.choice-letter').style.background = '#dc2626';
            ci.querySelector('.choice-letter').style.color = '#fff';
          }
        });

        if (explDiv) {
          explDiv.style.display = 'block';
        }
      });
    });
  }
}
