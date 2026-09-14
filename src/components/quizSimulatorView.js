import { MINISTRIES, CATEGORIES } from '../data/defaultData.js';
import { StorageService } from '../services/storage.js';
import { getIcon } from '../utils/icons.js';

export function renderQuizSimulatorView(container, navigateTo, showToast) {
  let quizState = 'config'; // 'config', 'running', 'result'
  let activeQuestions = [];
  let currentIndex = 0;
  let userAnswers = {}; // { questionId: optionIndex }
  let flaggedQuestions = new Set();
  let timerInterval = null;
  let remainingSeconds = 0;
  let totalTimeSeconds = 0;
  let currentResult = null;

  // Configuration settings
  let config = {
    categoryId: 'all',
    ministryId: 'all',
    questionCount: 10,
    durationMinutes: 15
  };

  function startQuiz() {
    const allQuestions = StorageService.getQuestions();
    let filtered = allQuestions.filter(q => {
      const matchCat = config.categoryId === 'all' || q.categoryId === config.categoryId;
      const matchMin = config.ministryId === 'all' || q.ministryId === config.ministryId || q.ministryId === 'all';
      return matchCat && matchMin;
    });

    if (filtered.length === 0) {
      showToast('មិនមានសំណួរសម្រាប់ជម្រើសនេះទេ សូមជ្រើសរើសមុខវិជ្ជាផ្សេង!', 'error');
      return;
    }

    // Shuffle questions
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const count = Math.min(config.questionCount, shuffled.length);
    activeQuestions = shuffled.slice(0, count);

    currentIndex = 0;
    userAnswers = {};
    flaggedQuestions = new Set();
    totalTimeSeconds = config.durationMinutes > 0 ? config.durationMinutes * 60 : 0;
    remainingSeconds = totalTimeSeconds;
    quizState = 'running';

    if (timerInterval) clearInterval(timerInterval);
    if (totalTimeSeconds > 0) {
      timerInterval = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();
        if (remainingSeconds <= 0) {
          clearInterval(timerInterval);
          finishQuiz(true);
        }
      }, 1000);
    }

    renderRunningQuiz();
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    const timerElem = container.querySelector('#quiz-timer');
    if (!timerElem) return;
    timerElem.textContent = formatTime(remainingSeconds);
    if (remainingSeconds <= 120) {
      timerElem.classList.add('warning');
    }
  }

  function finishQuiz(autoSubmit = false) {
    if (timerInterval) clearInterval(timerInterval);

    // Calculate score
    let correctCount = 0;
    activeQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / activeQuestions.length) * 100);
    const timeSpent = totalTimeSeconds > 0 ? (totalTimeSeconds - remainingSeconds) : 0;

    currentResult = {
      score: correctCount,
      totalQuestions: activeQuestions.length,
      percentage,
      timeSpent,
      categoryId: config.categoryId,
      ministryId: config.ministryId,
      questions: activeQuestions,
      answers: { ...userAnswers }
    };

    // Save to history
    StorageService.saveQuizResult(currentResult);
    quizState = 'result';

    if (autoSubmit) {
      showToast('អស់ពេលកំណត់! តេស្តត្រូវបានបញ្ជូនដោយស្វ័យប្រវត្តិ។', 'error');
    } else {
      showToast('អ្នកបានបញ្ចប់ការប្រឡងតេស្តរួចរាល់!', 'success');
    }

    renderQuizResult();
  }

  // 1. Render Config Screen
  function renderConfig() {
    const allQuestions = StorageService.getQuestions();

    if (allQuestions.length === 0) {
      container.innerHTML = `
        <div class="quiz-config-card" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="display: flex; justify-content: center; margin-bottom: 0.75rem; color: var(--primary-600);">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: var(--bg-subtle);">
              ${getIcon('helpCircle')}
            </span>
          </div>
          <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem;">
            មិនទាន់មានសំណួរតេស្តនៅឡើយទេ
          </h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); max-width: 360px; margin: 0 auto 1.5rem; line-height: 1.6;">
            សំណួរតេស្តសាកល្បងនឹងបង្ហាញនៅទីនេះ ពេល Admin ចាប់ផ្តើមបញ្ចូលសំណួរថ្មី។
          </p>
          <button id="btn-go-home" class="btn-primary" style="margin: 0 auto; display: inline-flex; align-items: center; gap: 0.4rem;">
            ${getIcon('arrowLeft')} <span>ត្រឡប់ទៅទំព័រដើម</span>
          </button>
        </div>
      `;
      container.querySelector('#btn-go-home')?.addEventListener('click', () => navigateTo('home'));
      return;
    }

    container.innerHTML = `
      <div class="quiz-config-card">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
            <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('timer')}</span>
            <span>តេស្តសាកល្បងក្របខ័ណ្ឌរដ្ឋ (Mock Exam)</span>
          </h2>
          <p style="font-size: 0.9rem; color: var(--text-muted);">
            វាស់ស្ទង់សមត្ថភាពចំណេះដឹងទូទៅ ច្បាប់រដ្ឋបាល និងជំនាញឯកទេសតាមស្តង់ដារប្រឡងរដ្ឋ
          </p>
        </div>

        <!-- Ministry Filter -->
        <div class="config-group">
          <label class="config-label" style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('building')}</span>
            <span>ស្ថាប័ន / ក្រសួងគោលដៅ</span>
          </label>
          <select id="cfg-ministry" class="form-select">
            ${MINISTRIES.map(m => `
              <option value="${m.id}" ${m.id === config.ministryId ? 'selected' : ''}>${m.name}</option>
            `).join('')}
          </select>
        </div>

        <!-- Category Selection -->
        <div class="config-group">
          <label class="config-label" style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('book')}</span>
            <span>មុខវិជ្ជាប្រឡង</span>
          </label>
          <select id="cfg-category" class="form-select">
            <option value="all">គ្រប់មុខវិជ្ជាទាំងអស់ (សំណួរចម្រុះ)</option>
            ${CATEGORIES.map(c => `
              <option value="${c.id}" ${c.id === config.categoryId ? 'selected' : ''}>${c.name}</option>
            `).join('')}
          </select>
        </div>

        <!-- Question Count -->
        <div class="config-group">
          <label class="config-label" style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('helpCircle')}</span>
            <span>ចំនួនសំណួរ</span>
          </label>
          <div class="options-selector-grid" id="selector-q-count">
            <button class="selector-btn ${config.questionCount === 5 ? 'selected' : ''}" data-value="5">៥ សំណួរ</button>
            <button class="selector-btn ${config.questionCount === 10 ? 'selected' : ''}" data-value="10">១០ សំណួរ</button>
            <button class="selector-btn ${config.questionCount === 20 ? 'selected' : ''}" data-value="20">២០ សំណួរ</button>
          </div>
        </div>

        <!-- Duration Limit -->
        <div class="config-group">
          <label class="config-label" style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('timer')}</span>
            <span>រយៈពេលកំណត់</span>
          </label>
          <div class="options-selector-grid" id="selector-time">
            <button class="selector-btn ${config.durationMinutes === 10 ? 'selected' : ''}" data-value="10">១០ នាទី</button>
            <button class="selector-btn ${config.durationMinutes === 15 ? 'selected' : ''}" data-value="15">១៥ នាទី</button>
            <button class="selector-btn ${config.durationMinutes === 30 ? 'selected' : ''}" data-value="30">៣០ នាទី</button>
          </div>
        </div>

        <button id="btn-start-test" class="btn-primary" style="width: 100%; justify-content: center; padding: 0.85rem; font-size: 1.05rem; margin-top: 0.5rem;">
          <span style="display: inline-flex; align-items: center; gap: 0.4rem;">${getIcon('zap')} ចាប់ផ្តើមធ្វើតេស្ត</span>
        </button>

        <div style="margin-top: 1rem; text-align: center; font-size: 0.8rem; color: var(--text-muted);">
          ទិន្នន័យសំណួរមានស្រាប់ក្នុងប្រព័ន្ធ៖ ${allQuestions.length} សំណួរ
        </div>
      </div>
    `;

    // Event listeners
    container.querySelector('#cfg-ministry')?.addEventListener('change', (e) => config.ministryId = e.target.value);
    container.querySelector('#cfg-category')?.addEventListener('change', (e) => config.categoryId = e.target.value);

    container.querySelectorAll('#selector-q-count .selector-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('#selector-q-count .selector-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        config.questionCount = parseInt(btn.dataset.value, 10);
      });
    });

    container.querySelectorAll('#selector-time .selector-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('#selector-time .selector-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        config.durationMinutes = parseInt(btn.dataset.value, 10);
      });
    });

    container.querySelector('#btn-start-test')?.addEventListener('click', startQuiz);
  }

  // 2. Render Running Test
  function renderRunningQuiz() {
    const q = activeQuestions[currentIndex];
    const total = activeQuestions.length;
    const progressPercent = Math.round(((currentIndex + 1) / total) * 100);
    const isFlagged = flaggedQuestions.has(q.id);
    const selectedOption = userAnswers[q.id];

    container.innerHTML = `
      <div class="quiz-runner-container">
        <!-- Runner Top Bar -->
        <div class="quiz-runner-header">
          <div>
            <span style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">
              សំណួរទី <span style="font-family: var(--font-family-numbers); color: var(--primary-600);">${currentIndex + 1}</span> / ${total}
            </span>
          </div>

          <div class="quiz-timer-badge" id="quiz-timer">
            ${totalTimeSeconds > 0 ? formatTime(remainingSeconds) : '∞ គ្មានកំណត់'}
          </div>

          <button id="btn-submit-early" class="btn-table-action btn-table-delete" style="padding: 0.4rem 0.8rem;">
            បញ្ចប់តេស្ត
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="quiz-progress-bar-container">
          <div class="quiz-progress-bar" style="width: ${progressPercent}%;"></div>
        </div>

        <!-- Question Card -->
        <div class="question-card">
          <div class="question-meta">
            <span class="exam-badge">${q.difficulty || 'មធ្យម'}</span>
            <button class="btn-flag ${isFlagged ? 'flagged' : ''}" id="btn-toggle-flag" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              <span style="display: inline-flex; align-items: center;">${isFlagged ? getIcon('flagFilled') : getIcon('flag')}</span>
              <span>${isFlagged ? 'បានសម្គាល់' : 'សម្គាល់សំណួរ'}</span>
            </button>
          </div>

          <h3 class="question-text">${q.question}</h3>

          ${q.imageUrl ? `
            <div class="question-media-wrapper">
              <img src="${q.imageUrl}" alt="Question diagram" />
            </div>
          ` : ''}

          <!-- Choices -->
          <div class="choices-list" id="active-choices-list">
            ${q.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return `
                <div class="choice-item ${isSelected ? 'selected' : ''}" data-index="${idx}">
                  <span class="choice-letter">${['ក', 'ខ', 'គ', 'ឃ'][idx] || (idx + 1)}</span>
                  <span class="choice-text">${opt}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Question Actions -->
          <div class="quiz-actions-bar">
            <button id="btn-prev-q" class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color); display: inline-flex; align-items: center; gap: 0.35rem;" ${currentIndex === 0 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>
              ${getIcon('arrowLeft')} <span>ថយក្រោយ</span>
            </button>

            <!-- Question Overview Drawer Trigger -->
            <button id="btn-show-drawer" class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('barChart')} <span>បញ្ជីសំណួរ (${Object.keys(userAnswers).length}/${total})</span>
            </button>

            ${currentIndex < total - 1 ? `
              <button id="btn-next-q" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                <span>បន្ទាប់</span> ${getIcon('arrowRight')}
              </button>
            ` : `
              <button id="btn-finish-quiz" class="btn-primary" style="background: linear-gradient(135deg, var(--success-600), var(--success-500)); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35); display: inline-flex; align-items: center; gap: 0.35rem;">
                ${getIcon('checkCircle')} <span>បញ្ចប់ការប្រឡង</span>
              </button>
            `}
          </div>
        </div>

        <!-- Question Drawer Modal Container -->
        <div id="drawer-container" style="display: none; margin-top: 1rem; padding: 1.25rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl);">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary);">
            តារាងសំណួរទាំងអស់ (រំលងទៅសំណួរ)៖
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 0.5rem;">
            ${activeQuestions.map((ques, i) => {
              const isAns = userAnswers[ques.id] !== undefined;
              const isFlg = flaggedQuestions.has(ques.id);
              const isCur = i === currentIndex;
              let bg = 'var(--bg-subtle)';
              let color = 'var(--text-primary)';
              let border = '1px solid var(--border-color)';

              if (isCur) {
                border = '2px solid var(--primary-600)';
              }
              if (isAns) {
                bg = 'var(--primary-50)';
                color = 'var(--primary-700)';
              }
              if (isFlg) {
                bg = '#fef3c7';
                color = '#b45309';
              }

              return `
                <button class="drawer-jump-btn" data-index="${i}" style="height: 44px; border-radius: var(--radius-md); background: ${bg}; color: ${color}; border: ${border}; font-weight: 700; font-size: 0.85rem; font-family: var(--font-family-numbers);">
                  ${i + 1}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Choices click
    container.querySelectorAll('#active-choices-list .choice-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index, 10);
        userAnswers[q.id] = idx;
        renderRunningQuiz();
      });
    });

    // Flag toggle
    container.querySelector('#btn-toggle-flag')?.addEventListener('click', () => {
      if (flaggedQuestions.has(q.id)) {
        flaggedQuestions.delete(q.id);
      } else {
        flaggedQuestions.add(q.id);
      }
      renderRunningQuiz();
    });

    // Prev / Next
    container.querySelector('#btn-prev-q')?.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        renderRunningQuiz();
      }
    });

    container.querySelector('#btn-next-q')?.addEventListener('click', () => {
      if (currentIndex < total - 1) {
        currentIndex++;
        renderRunningQuiz();
      }
    });

    // Submit early or finish
    const submitPrompt = () => {
      const unanswered = activeQuestions.filter(ques => userAnswers[ques.id] === undefined).length;
      let msg = 'តើអ្នកប្រាកដជាចង់បញ្ចប់ការប្រឡងតេស្តឥឡូវនេះមែនទេ?';
      if (unanswered > 0) {
        msg = `អ្នកនៅសល់សំណួរចំនួន ${unanswered} មិនទាន់បានឆ្លើយនៅឡើយ! តើអ្នកប្រាកដជាចង់បញ្ចប់មែនទេ?`;
      }
      if (confirm(msg)) {
        finishQuiz(false);
      }
    };

    container.querySelector('#btn-submit-early')?.addEventListener('click', submitPrompt);
    container.querySelector('#btn-finish-quiz')?.addEventListener('click', submitPrompt);

    // Toggle drawer
    const drawer = container.querySelector('#drawer-container');
    container.querySelector('#btn-show-drawer')?.addEventListener('click', () => {
      if (drawer) {
        drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
      }
    });

    // Jump from drawer
    container.querySelectorAll('.drawer-jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentIndex = parseInt(btn.dataset.index, 10);
        renderRunningQuiz();
      });
    });
  }

  // 3. Render Quiz Results
  function renderQuizResult() {
    if (!currentResult) {
      quizState = 'config';
      renderConfig();
      return;
    }

    const { score, totalQuestions, percentage, timeSpent, questions, answers } = currentResult;
    const isPassed = percentage >= 50;

    container.innerHTML = `
      <div class="quiz-result-card">
        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: center; margin-bottom: 0.5rem; color: ${isPassed ? 'var(--success-600)' : 'var(--primary-600)'};">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: var(--radius-full); background: ${isPassed ? '#ecfdf5' : '#eff6ff'};">
              ${isPassed ? getIcon('award') : getIcon('target')}
            </span>
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">
            លទ្ធផលតេស្តសាកល្បង
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            ${isPassed ? 'អបអរសាទរ! អ្នកបានឆ្លងកាត់ការប្រឡងតេស្តនេះ។' : 'កុំទាន់បាក់ទឹកចិត្ត! សូមពិនិត្យចម្លើយខុស ហើយហ្វឹកហាត់បន្ថែមទៀត។'}
          </p>
        </div>

        <!-- Score Ring -->
        <div class="score-circle">
          <span class="score-number">${percentage}%</span>
          <span class="score-total">${score} លើ ${totalQuestions} សំណួរ</span>
        </div>

        <div>
          <span class="result-badge ${isPassed ? 'passed' : 'failed'}">
            ${isPassed 
              ? `<span style="display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('check')} <span>ជាប់ (PASSED)</span></span>` 
              : `<span style="display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('x')} <span>ធ្លាក់ (FAILED)</span></span>`}
          </span>
        </div>

        <div style="display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1.75rem; font-size: 0.9rem; color: var(--text-secondary); flex-wrap: wrap;">
          <div style="display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('timer')} រយៈពេលប្រើប្រាស់៖ <strong>${formatTime(timeSpent)}</strong></div>
          <div style="display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('target')} ភាពត្រឹមត្រូវ៖ <strong>${score}/${totalQuestions}</strong></div>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem;">
          <button id="btn-retake-quiz" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('refresh')} <span>ធ្វើតេស្តម្តងទៀត</span>
          </button>
          <button id="btn-back-home" class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color); display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('home')} <span>ទៅកាន់ទំព័រដើម</span>
          </button>
        </div>

        <!-- Detailed Review List -->
        <div style="text-align: left; border-top: 1px solid var(--border-color); padding-top: 1.75rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
            <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('fileEdit')}</span>
            <span>ពិនិត្យចម្លើយ និងការពន្យល់លម្អិត (${questions.length})</span>
          </h3>

          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${questions.map((q, qIndex) => {
              const userChoiceIdx = answers[q.id];
              const isCorrect = userChoiceIdx === q.correctAnswer;
              const hasAnswered = userChoiceIdx !== undefined;

              return `
                <div style="background: var(--bg-subtle); border-radius: var(--radius-lg); border: 1.5px solid ${isCorrect ? 'var(--success-500)' : 'var(--danger-500)'}; padding: 1.2rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">
                      សំណួរទី ${qIndex + 1}
                    </span>
                    <span style="font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); background: ${isCorrect ? '#dcfce7' : '#fee2e2'}; color: ${isCorrect ? '#15803d' : '#dc2626'}; display: inline-flex; align-items: center; gap: 0.25rem;">
                      ${isCorrect ? `${getIcon('check')} <span>ត្រឹមត្រូវ</span>` : (hasAnswered ? `${getIcon('x')} <span>ខុស</span>` : '<span>មិនបានឆ្លើយ</span>')}
                    </span>
                  </div>

                  <p style="font-weight: 600; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.75rem; line-height: 1.5;">
                    ${q.question}
                  </p>

                  ${q.imageUrl ? `
                    <div style="margin-bottom: 0.75rem; max-height: 200px; overflow: hidden; border-radius: var(--radius-md);">
                      <img src="${q.imageUrl}" alt="Diagram" style="max-height: 200px; max-width: 100%; object-fit: contain;" />
                    </div>
                  ` : ''}

                  <!-- Options preview -->
                  <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem;">
                    ${q.options.map((opt, optIdx) => {
                      let itemStyle = 'padding: 0.5rem 0.75rem; border-radius: var(--radius-md); font-size: 0.88rem; display: flex; align-items: center; gap: 0.5rem; background: var(--bg-surface); border: 1px solid var(--border-color);';
                      if (optIdx === q.correctAnswer) {
                        itemStyle += ' border-color: var(--success-600); background: #dcfce7; color: #15803d; font-weight: 600;';
                      } else if (optIdx === userChoiceIdx && !isCorrect) {
                        itemStyle += ' border-color: var(--danger-600); background: #fee2e2; color: #dc2626;';
                      }
                      return `
                        <div style="${itemStyle}">
                          <span style="font-weight: 700;">${['ក', 'ខ', 'គ', 'ឃ'][optIdx] || (optIdx + 1)}.</span>
                          <span>${opt}</span>
                          ${optIdx === q.correctAnswer ? '<span style="margin-left: auto; font-size: 0.8rem;">(ចម្លើយត្រូវ)</span>' : ''}
                          ${optIdx === userChoiceIdx && !isCorrect ? '<span style="margin-left: auto; font-size: 0.8rem;">(ចម្លើយរបស់អ្នក)</span>' : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Explanation -->
                  <div style="background: var(--bg-surface); border-radius: var(--radius-md); padding: 0.85rem; border-left: 3px solid var(--primary-600); font-size: 0.85rem; color: var(--text-secondary); line-height: 1.55;">
                    <strong style="color: var(--primary-600); display: inline-flex; align-items: center; gap: 0.3rem;">${getIcon('bulb')} ការពន្យល់ & មូលដ្ឋានច្បាប់៖</strong> ${q.explanation || 'គ្មានការពន្យល់'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-retake-quiz')?.addEventListener('click', () => {
      quizState = 'config';
      renderConfig();
    });

    container.querySelector('#btn-back-home')?.addEventListener('click', () => navigateTo('home'));
  }

  // Initial render
  if (quizState === 'config') renderConfig();
  else if (quizState === 'running') renderRunningQuiz();
  else if (quizState === 'result') renderQuizResult();
}
