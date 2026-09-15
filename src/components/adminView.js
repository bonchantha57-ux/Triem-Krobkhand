import { MINISTRIES, CATEGORIES } from '../data/defaultData.js';
import { StorageService } from '../services/storage.js';
import { CloudflareService } from '../services/cloudflareApi.js';
import { getIcon } from '../utils/icons.js';
import { compressImageFile } from '../utils/imageCompressor.js';
import { parseFirebaseConfigInput } from '../utils/firebaseParser.js';

export function renderAdminView(container, showToast, refreshApp) {
  let activeTab = 'exams'; // 'exams', 'questions', 'cloudflare'
  let editingExamId = null;
  let editingQuestionId = null;
  let examImagePreview = '';
  let questionImagePreview = '';

  async function syncToCloudflareBackground() {
    const settings = StorageService.getSettings();
    if (!settings.cfWorkerUrl) return;

    try {
      const allExams = StorageService.getExams();
      const allQuestions = StorageService.getQuestions();
      const res = await CloudflareService.pushData(settings.cfWorkerUrl, settings.cfApiKey, {
        exams: allExams,
        questions: allQuestions
      });
      if (res && res.success) {
        showToast('ទិន្នន័យ និងរូបភាពបាន Sync ចូល Cloudflare D1 ដោយស្វ័យប្រវត្តិ!', 'success');
      }
    } catch (err) {
      console.warn('Auto-sync to Cloudflare notice:', err);
    }
  }

  function render() {
    const exams = StorageService.getExams();
    const questions = StorageService.getQuestions();
    const settings = StorageService.getSettings();

    container.innerHTML = `
      <div style="max-width: 1000px; margin: 0 auto;">
        <!-- Admin Header -->
        <div class="admin-header">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('shield')}</span>
              <span>ផ្ទាំងគ្រប់គ្រង Admin (Triem Krobkhand)</span>
            </h2>
            <p style="font-size: 0.88rem; color: var(--text-muted);">
              បញ្ចូល កែប្រែ និងគ្រប់គ្រងវិញ្ញាសា សំណួរតេស្ត ព្រមទាំងភ្ជាប់ទិន្នន័យជាមួយ Cloudflare
            </p>
          </div>

          <div class="admin-tabs">
            <button class="admin-tab-btn ${activeTab === 'exams' ? 'active' : ''}" data-tab="exams" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('book')} <span>វិញ្ញាសា (${exams.length})</span>
            </button>
            <button class="admin-tab-btn ${activeTab === 'questions' ? 'active' : ''}" data-tab="questions" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('helpCircle')} <span>សំណួរតេស្ត (${questions.length})</span>
            </button>
            <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" data-tab="users" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('users')} <span>អ្នកប្រើប្រាស់ (Users)</span>
            </button>
            <button class="admin-tab-btn ${activeTab === 'cloudflare' ? 'active' : ''}" data-tab="cloudflare" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('cloud')} <span>Cloudflare D1</span>
            </button>
            <button class="admin-tab-btn ${activeTab === 'account' ? 'active' : ''}" data-tab="account" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('lock')} <span>គណនី Admin</span>
            </button>
          </div>
        </div>

        <!-- Dynamic Admin Tab Content -->
        <div id="admin-tab-content"></div>
      </div>
    `;

    // Tab buttons
    container.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    const tabContainer = container.querySelector('#admin-tab-content');
    if (activeTab === 'exams') {
      renderExamsManager(tabContainer, exams);
    } else if (activeTab === 'questions') {
      renderQuestionsManager(tabContainer, questions);
    } else if (activeTab === 'users') {
      renderUsersManager(tabContainer, settings);
    } else if (activeTab === 'cloudflare') {
      renderCloudflareManager(tabContainer, settings);
    } else if (activeTab === 'account') {
      renderAccountManager(tabContainer);
    }
  }

  // ==========================================
  // 1. EXAMS MANAGEMENT TAB
  // ==========================================
  function renderExamsManager(tabContainer, exams) {
    const editingExam = editingExamId ? exams.find(e => e.id === editingExamId) : null;

    tabContainer.innerHTML = `
      <!-- Exam Input Form -->
      <div class="admin-form-card">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('fileEdit')}</span>
          <span>${editingExam ? 'កែប្រែវិញ្ញាសា' : 'បញ្ចូលវិញ្ញាសាថ្មី'}</span>
        </h3>

        <form id="exam-form">
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">ចំណងជើងវិញ្ញាសា *</label>
              <input type="text" id="exam-title" class="form-input" placeholder="ឧ. វិញ្ញាសាប្រឡងជ្រើសរើសមន្ត្រីជាន់ខ្ពស់..." value="${editingExam ? editingExam.title : ''}" required />
            </div>

            <div class="form-group">
              <label class="form-label">ក្រសួង / ស្ថាប័នរដ្ឋ *</label>
              <select id="exam-ministry" class="form-select">
                ${MINISTRIES.filter(m => m.id !== 'all').map(m => `
                  <option value="${m.id}" ${editingExam && editingExam.ministryId === m.id ? 'selected' : ''}>${m.name}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="form-row cols-3">
            <div class="form-group">
              <label class="form-label">មុខវិជ្ជា *</label>
              <select id="exam-category" class="form-select">
                ${CATEGORIES.map(c => `
                  <option value="${c.id}" ${editingExam && editingExam.categoryId === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">ឆ្នាំប្រឡង</label>
              <input type="text" id="exam-year" class="form-input" placeholder="2024" value="${editingExam ? editingExam.year : '2024'}" />
            </div>

            <div class="form-group">
              <label class="form-label">រយៈពេល (នាទី)</label>
              <input type="number" id="exam-duration" class="form-input" placeholder="60" value="${editingExam ? editingExam.durationMinutes : 60}" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">សេចក្តីសង្ខេបអំពីវិញ្ញាសា</label>
            <input type="text" id="exam-desc" class="form-input" placeholder="ឧ. វិញ្ញាសាផ្តោតលើរដ្ឋបាលសាធារណៈទំនើប និងច្បាប់មន្ត្រីរាជការ..." value="${editingExam ? (editingExam.description || '') : ''}" />
          </div>

          <!-- Image Upload with File reader and Preview -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">រូបភាពគម្រប ឬរូបភាពឯកសារវិញ្ញាសា (ជ្រើសរើសពីទូរស័ព្ទ ឬកុំព្យូទ័រ)</label>
            <div class="image-upload-box" id="exam-upload-box">
              <input type="file" id="exam-file-input" accept="image/*" style="display: none;" />
              <div id="exam-upload-prompt">
                <span style="color: var(--primary-600); display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--radius-full); background: var(--primary-50); margin: 0 auto;">${getIcon('image')}</span>
                <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.5rem;">
                  ចុចទីនេះដើម្បី Upload រូបភាព ឬទម្លាក់រូបភាព (PNG, JPG, WebP)
                </p>
              </div>
              <div id="exam-img-preview-container" class="image-preview-wrapper" style="${(examImagePreview || (editingExam && editingExam.imageUrl)) ? 'display: inline-block;' : 'display: none;'}">
                <img id="exam-preview-img" src="${examImagePreview || (editingExam ? editingExam.imageUrl : '')}" alt="Preview" />
                <button type="button" class="btn-remove-preview" id="btn-remove-exam-img" title="ដករូបភាពចេញ" style="display: inline-flex; align-items: center; justify-content: center;">${getIcon('x')}</button>
              </div>
            </div>
            <div style="margin-top: 0.5rem;">
              <input type="url" id="exam-img-url" class="form-input" placeholder="ឬបញ្ចូល Link URL រូបភាព (https://...)" value="${editingExam ? (editingExam.imageUrl || '') : ''}" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">ខ្លឹមសារវិញ្ញាសាទាំងមូល (អត្ថបទ & សំណួរចម្លើយ) *</label>
            <textarea id="exam-content" class="form-textarea" style="min-height: 180px;" placeholder="បញ្ចូលខ្លឹមសារសំណួរ សេចក្តីណែនាំ និងគន្លឹះឆ្លើយ..." required>${editingExam ? editingExam.content : ''}</textarea>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
            ${editingExam ? `
              <button type="button" id="btn-cancel-exam-edit" class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color);">
                បោះបង់
              </button>
            ` : ''}
            <button type="submit" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('save')} <span>${editingExam ? 'រក្សាទុកការកែប្រែ' : 'បញ្ចូលវិញ្ញាសា'}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Existing Exams List Table -->
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>រូបភាព</th>
              <th>ចំណងជើងវិញ្ញាសា</th>
              <th>ស្ថាប័ន / ក្រសួង</th>
              <th>មុខវិជ្ជា</th>
              <th>ឆ្នាំ</th>
              <th>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody>
            ${exams.map(exam => `
              <tr>
                <td style="width: 60px;">
                  <img src="${exam.imageUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=120&q=80'}" style="width: 48px; height: 36px; object-fit: cover; border-radius: var(--radius-sm);" alt="" />
                </td>
                <td style="font-weight: 600; max-width: 260px;">${exam.title}</td>
                <td><span class="exam-badge">${exam.ministryName || exam.ministryId}</span></td>
                <td>${exam.categoryName || exam.categoryId}</td>
                <td>${exam.year || '2024'}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn-table-action btn-table-edit btn-edit-exam" data-id="${exam.id}">កែ</button>
                    <button class="btn-table-action btn-table-delete btn-delete-exam" data-id="${exam.id}">លុប</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // File input handlers
    const uploadBox = tabContainer.querySelector('#exam-upload-box');
    const fileInput = tabContainer.querySelector('#exam-file-input');
    const previewContainer = tabContainer.querySelector('#exam-img-preview-container');
    const previewImg = tabContainer.querySelector('#exam-preview-img');
    const removeImgBtn = tabContainer.querySelector('#btn-remove-exam-img');
    const promptText = tabContainer.querySelector('#exam-upload-prompt');
    const urlInput = tabContainer.querySelector('#exam-img-url');

    uploadBox?.addEventListener('click', (e) => {
      if (e.target !== removeImgBtn && !removeImgBtn.contains(e.target)) {
        fileInput?.click();
      }
    });

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          examImagePreview = await compressImageFile(file, 1200, 1200, 0.8);
          previewImg.src = examImagePreview;
          previewContainer.style.display = 'inline-block';
          if (promptText) promptText.style.display = 'none';
          urlInput.value = '';
        } catch (err) {
          console.error('Image compression error:', err);
        }
      }
    });

    removeImgBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      examImagePreview = '';
      previewImg.src = '';
      previewContainer.style.display = 'none';
      if (promptText) promptText.style.display = 'block';
      fileInput.value = '';
      urlInput.value = '';
    });

    // Form submit
    tabContainer.querySelector('#exam-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = tabContainer.querySelector('#exam-title').value.trim();
      const ministryId = tabContainer.querySelector('#exam-ministry').value;
      const categoryId = tabContainer.querySelector('#exam-category').value;
      const year = tabContainer.querySelector('#exam-year').value.trim() || '2024';
      const durationMinutes = parseInt(tabContainer.querySelector('#exam-duration').value, 10) || 60;
      const description = tabContainer.querySelector('#exam-desc').value.trim();
      const content = tabContainer.querySelector('#exam-content').value.trim();
      const finalImage = examImagePreview || urlInput.value.trim();

      const ministryObj = MINISTRIES.find(m => m.id === ministryId);
      const categoryObj = CATEGORIES.find(c => c.id === categoryId);

      const examData = {
        id: editingExamId || ('exam-' + Date.now()),
        title,
        ministryId,
        ministryName: ministryObj ? ministryObj.name : ministryId,
        categoryId,
        categoryName: categoryObj ? categoryObj.name : categoryId,
        year,
        durationMinutes,
        difficulty: 'មធ្យម',
        description,
        content,
        imageUrl: finalImage
      };

      StorageService.saveExam(examData);
      showToast(editingExamId ? 'បានកែប្រែវិញ្ញាសារួចរាល់!' : 'បានបញ្ចូលវិញ្ញាសាថ្មីជោគជ័យ!', 'success');
      editingExamId = null;
      examImagePreview = '';
      render();
      syncToCloudflareBackground();
    });

    // Cancel edit
    tabContainer.querySelector('#btn-cancel-exam-edit')?.addEventListener('click', () => {
      editingExamId = null;
      examImagePreview = '';
      render();
    });

    // Edit action
    tabContainer.querySelectorAll('.btn-edit-exam').forEach(btn => {
      btn.addEventListener('click', () => {
        editingExamId = btn.dataset.id;
        examImagePreview = '';
        render();
      });
    });

    // Delete action
    tabContainer.querySelectorAll('.btn-delete-exam').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('តើអ្នកពិតជាចង់លុបវិញ្ញាសានេះមែនទេ?')) {
          StorageService.deleteExam(btn.dataset.id);
          showToast('បានលុបវិញ្ញាសារួចរាល់', 'success');
          render();
          syncToCloudflareBackground();
        }
      });
    });
  }

  // ==========================================
  // 2. QUESTIONS MANAGEMENT TAB
  // ==========================================
  function renderQuestionsManager(tabContainer, questions) {
    const editingQ = editingQuestionId ? questions.find(q => q.id === editingQuestionId) : null;

    tabContainer.innerHTML = `
      <div class="admin-form-card">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('helpCircle')}</span>
          <span>${editingQ ? 'កែប្រែសំណួរតេស្ត' : 'បញ្ចូលសំណួរតេស្តថ្មី'}</span>
        </h3>

        <form id="question-form">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">ខ្លឹមសារសំណួរ *</label>
            <textarea id="q-text" class="form-textarea" style="min-height: 80px;" placeholder="វាយបញ្ចូលសំណួរ..." required>${editingQ ? editingQ.question : ''}</textarea>
          </div>

          <div class="form-row cols-3">
            <div class="form-group">
              <label class="form-label">មុខវិជ្ជា *</label>
              <select id="q-category" class="form-select">
                ${CATEGORIES.map(c => `
                  <option value="${c.id}" ${editingQ && editingQ.categoryId === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">ស្ថាប័ន / ក្រសួង</label>
              <select id="q-ministry" class="form-select">
                ${MINISTRIES.map(m => `
                  <option value="${m.id}" ${editingQ && editingQ.ministryId === m.id ? 'selected' : ''}>${m.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">កម្រិតពិបាក</label>
              <select id="q-difficulty" class="form-select">
                <option value="ងាយស្រួល" ${editingQ && editingQ.difficulty === 'ងាយស្រួល' ? 'selected' : ''}>ងាយស្រួល</option>
                <option value="មធ្យម" ${editingQ && editingQ.difficulty === 'មធ្យម' ? 'selected' : ''}>មធ្យម</option>
                <option value="ពិបាក" ${editingQ && editingQ.difficulty === 'ពិបាក' ? 'selected' : ''}>ពិបាក</option>
              </select>
            </div>
          </div>

          <!-- Image Attachment for Question -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">រូបភាពដ្យាក្រាម ឬគំនូសបំព្រួញ (បើមាន)</label>
            <div class="image-upload-box" id="q-upload-box">
              <input type="file" id="q-file-input" accept="image/*" style="display: none;" />
              <div id="q-upload-prompt">
                <span style="color: var(--primary-600); display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: var(--radius-full); background: var(--primary-50); margin: 0 auto;">${getIcon('image')}</span>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.4rem;">
                  ជ្រើសរើសរូបភាពដ្យាក្រាមពីទូរស័ព្ទ ឬកុំព្យូទ័រ
                </p>
              </div>
              <div id="q-img-preview-container" class="image-preview-wrapper" style="${(questionImagePreview || (editingQ && editingQ.imageUrl)) ? 'display: inline-block;' : 'display: none;'}">
                <img id="q-preview-img" src="${questionImagePreview || (editingQ ? editingQ.imageUrl : '')}" alt="Diagram Preview" />
                <button type="button" class="btn-remove-preview" id="btn-remove-q-img" style="display: inline-flex; align-items: center; justify-content: center;">${getIcon('x')}</button>
              </div>
            </div>
            <div style="margin-top: 0.5rem;">
              <input type="url" id="q-img-url" class="form-input" placeholder="ឬ Link URL រូបភាព (https://...)" value="${editingQ ? (editingQ.imageUrl || '') : ''}" />
            </div>
          </div>

          <!-- 4 Multiple Choices Inputs -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">ជម្រើសចម្លើយទាំង ៤ (សូមចុចជ្រើសរើសរង្វង់ចម្លើយណាដែលត្រឹមត្រូវ) *</label>
            
            <div class="choice-builder-item">
              <input type="radio" name="correct-choice" value="0" class="radio-check" ${(!editingQ || editingQ.correctAnswer === 0) ? 'checked' : ''} />
              <span class="choice-letter">ក</span>
              <input type="text" id="q-opt-0" class="form-input" placeholder="ជម្រើសទី ១ (ក)" value="${editingQ ? (editingQ.options[0] || '') : ''}" required />
            </div>

            <div class="choice-builder-item">
              <input type="radio" name="correct-choice" value="1" class="radio-check" ${editingQ && editingQ.correctAnswer === 1 ? 'checked' : ''} />
              <span class="choice-letter">ខ</span>
              <input type="text" id="q-opt-1" class="form-input" placeholder="ជម្រើសទី ២ (ខ)" value="${editingQ ? (editingQ.options[1] || '') : ''}" required />
            </div>

            <div class="choice-builder-item">
              <input type="radio" name="correct-choice" value="2" class="radio-check" ${editingQ && editingQ.correctAnswer === 2 ? 'checked' : ''} />
              <span class="choice-letter">គ</span>
              <input type="text" id="q-opt-2" class="form-input" placeholder="ជម្រើសទី ៣ (គ)" value="${editingQ ? (editingQ.options[2] || '') : ''}" required />
            </div>

            <div class="choice-builder-item">
              <input type="radio" name="correct-choice" value="3" class="radio-check" ${editingQ && editingQ.correctAnswer === 3 ? 'checked' : ''} />
              <span class="choice-letter">ឃ</span>
              <input type="text" id="q-opt-3" class="form-input" placeholder="ជម្រើសទី ៤ (ឃ)" value="${editingQ ? (editingQ.options[3] || '') : ''}" required />
            </div>
          </div>

          <!-- Explanation -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">ការពន្យល់លម្អិត & មូលដ្ឋានច្បាប់ (លោតបង្ហាញពេលតេស្តចប់) *</label>
            <textarea id="q-explanation" class="form-textarea" placeholder="ពន្យល់ពីមូលហេតុដែលចម្លើយនេះត្រឹមត្រូវ យោងតាមច្បាប់ ឬទ្រឹស្តី..." required>${editingQ ? editingQ.explanation : ''}</textarea>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
            ${editingQ ? `
              <button type="button" id="btn-cancel-q-edit" class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color);">
                បោះបង់
              </button>
            ` : ''}
            <button type="submit" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('save')} <span>${editingQ ? 'រក្សាទុកការកែប្រែ' : 'បញ្ចូលសំណួរ'}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Questions List Table -->
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>សំណួរ</th>
              <th>មុខវិជ្ជា</th>
              <th>ចម្លើយត្រូវ</th>
              <th>កម្រិត</th>
              <th>រូបភាព</th>
              <th>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody>
            ${questions.map(q => `
              <tr>
                <td style="font-weight: 600; max-width: 320px;">${q.question}</td>
                <td><span class="exam-badge">${CATEGORIES.find(c => c.id === q.categoryId)?.name || q.categoryId}</span></td>
                <td><strong>${['ក', 'ខ', 'គ', 'ឃ'][q.correctAnswer] || 'ក'}</strong></td>
                <td>${q.difficulty || 'មធ្យម'}</td>
                <td>${q.imageUrl ? '<span style="display: inline-flex; align-items: center; gap: 0.2rem; color: var(--primary-600);">' + getIcon('image') + ' មាន</span>' : '—'}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn-table-action btn-table-edit btn-edit-q" data-id="${q.id}">កែ</button>
                    <button class="btn-table-action btn-table-delete btn-delete-q" data-id="${q.id}">លុប</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Question image uploader
    const qUploadBox = tabContainer.querySelector('#q-upload-box');
    const qFileInput = tabContainer.querySelector('#q-file-input');
    const qPreviewContainer = tabContainer.querySelector('#q-img-preview-container');
    const qPreviewImg = tabContainer.querySelector('#q-preview-img');
    const qRemoveBtn = tabContainer.querySelector('#btn-remove-q-img');
    const qPrompt = tabContainer.querySelector('#q-upload-prompt');
    const qUrlInput = tabContainer.querySelector('#q-img-url');

    qUploadBox?.addEventListener('click', (e) => {
      if (e.target !== qRemoveBtn && !qRemoveBtn.contains(e.target)) {
        qFileInput?.click();
      }
    });

    qFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          questionImagePreview = await compressImageFile(file, 1000, 1000, 0.82);
          qPreviewImg.src = questionImagePreview;
          qPreviewContainer.style.display = 'inline-block';
          if (qPrompt) qPrompt.style.display = 'none';
          qUrlInput.value = '';
        } catch (err) {
          console.error('Question image compression error:', err);
        }
      }
    });

    qRemoveBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      questionImagePreview = '';
      qPreviewImg.src = '';
      qPreviewContainer.style.display = 'none';
      if (qPrompt) qPrompt.style.display = 'block';
      qFileInput.value = '';
      qUrlInput.value = '';
    });

    // Form submit
    tabContainer.querySelector('#question-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const questionText = tabContainer.querySelector('#q-text').value.trim();
      const categoryId = tabContainer.querySelector('#q-category').value;
      const ministryId = tabContainer.querySelector('#q-ministry').value;
      const difficulty = tabContainer.querySelector('#q-difficulty').value;
      const opt0 = tabContainer.querySelector('#q-opt-0').value.trim();
      const opt1 = tabContainer.querySelector('#q-opt-1').value.trim();
      const opt2 = tabContainer.querySelector('#q-opt-2').value.trim();
      const opt3 = tabContainer.querySelector('#q-opt-3').value.trim();
      const correctRadio = tabContainer.querySelector('input[name="correct-choice"]:checked');
      const correctAnswer = correctRadio ? parseInt(correctRadio.value, 10) : 0;
      const explanation = tabContainer.querySelector('#q-explanation').value.trim();
      const finalImg = questionImagePreview || qUrlInput.value.trim();

      const questionData = {
        id: editingQuestionId || ('q-' + Date.now()),
        question: questionText,
        categoryId,
        ministryId,
        difficulty,
        imageUrl: finalImg,
        options: [opt0, opt1, opt2, opt3],
        correctAnswer,
        explanation
      };

      StorageService.saveQuestion(questionData);
      showToast(editingQuestionId ? 'បានកែប្រែសំណួរជោគជ័យ!' : 'បានបញ្ចូលសំណួរថ្មីជោគជ័យ!', 'success');
      editingQuestionId = null;
      questionImagePreview = '';
      render();
      syncToCloudflareBackground();
    });

    // Cancel edit
    tabContainer.querySelector('#btn-cancel-q-edit')?.addEventListener('click', () => {
      editingQuestionId = null;
      questionImagePreview = '';
      render();
    });

    // Edit action
    tabContainer.querySelectorAll('.btn-edit-q').forEach(btn => {
      btn.addEventListener('click', () => {
        editingQuestionId = btn.dataset.id;
        questionImagePreview = '';
        render();
      });
    });

    // Delete action
    tabContainer.querySelectorAll('.btn-delete-q').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('តើអ្នកពិតជាចង់លុបសំណួរនេះមែនទេ?')) {
          StorageService.deleteQuestion(btn.dataset.id);
          showToast('បានលុបសំណួររួចរាល់', 'success');
          render();
          syncToCloudflareBackground();
        }
      });
    });
  }

  // ==========================================
  // 3. CLOUDFLARE D1 SYNC & DATABASE TAB
  // ==========================================
  function renderCloudflareManager(tabContainer, settings) {
    tabContainer.innerHTML = `
      <div class="admin-form-card">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('cloud')}</span>
          <span>ការភ្ជាប់ជាមួយ Cloudflare D1 Database</span>
        </h3>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          អ្នកអាចដាក់ពង្រាយ (Deploy) Cloudflare Worker ដែលមានស្រាប់ក្នុង folder <code>cloudflare/</code> រួចបញ្ចូល Worker URL នៅទីនេះ ដើម្បីធ្វើសមកាលកម្មទិន្នន័យលើ Cloudflare ដោយផ្ទាល់។
        </p>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Cloudflare Worker API URL</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="url" id="cf-worker-url" class="form-input" placeholder="https://triem-krobkhand-api.your-subdomain.workers.dev" value="${settings.cfWorkerUrl || ''}" />
            <button id="btn-test-cf" class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color); white-space: nowrap; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('search')} <span>សាកល្បងតភ្ជាប់</span>
            </button>
          </div>
          <div id="cf-status-msg" style="margin-top: 0.4rem; font-size: 0.85rem;"></div>
        </div>

        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label">Cloudflare API Secret (ជម្រើសបន្ថែម)</label>
          <input type="password" id="cf-api-key" class="form-input" placeholder="API Secret Key សម្រាប់ការពារការបញ្ចូលទិន្នន័យ" value="${settings.cfApiKey || ''}" />
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          <button id="btn-save-cf-settings" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('save')} <span>រក្សាទុកការកំណត់</span>
          </button>
          <button id="btn-push-to-cf" class="btn-secondary" style="background: var(--primary-50); color: var(--primary-700); border-color: var(--primary-500); display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('upload')} <span>បញ្ជូនទិន្នន័យទាំងអស់ទៅ Cloudflare (Push)</span>
          </button>
          <button id="btn-pull-from-cf" class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color); display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('download')} <span>ទាញទិន្នន័យពី Cloudflare (Pull)</span>
          </button>
        </div>

        <!-- Local Backup & Restore -->
        <hr style="border: none; border-top: 1px solid var(--border-color); margin-bottom: 1.5rem;" />

        <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
          <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('package')}</span>
          <span>ការបម្រុងទុក និងស្តារទិន្នន័យ (Backup / Restore)</span>
        </h4>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
          <button id="btn-export-json" class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color); display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('download')} <span>Export ជា File JSON</span>
          </button>
          <label class="btn-secondary" style="color: var(--text-primary); border-color: var(--border-color); cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('upload')} <span>Import ពី File JSON</span>
            <input type="file" id="input-import-json" accept=".json" style="display: none;" />
          </label>
          <button id="btn-reset-sample" class="btn-table-action btn-table-delete" style="padding: 0.6rem 1rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            ${getIcon('refresh')} <span>កំណត់ឡើងវិញនូវសំណួរគំរូដើម</span>
          </button>
        </div>
      </div>
    `;

    const urlInput = tabContainer.querySelector('#cf-worker-url');
    const keyInput = tabContainer.querySelector('#cf-api-key');
    const statusMsg = tabContainer.querySelector('#cf-status-msg');

    // Test connection
    tabContainer.querySelector('#btn-test-cf')?.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();
      if (!url) {
        statusMsg.innerHTML = '<span style="color: var(--danger-600);">សូមបញ្ចូល Worker URL!</span>';
        return;
      }
      statusMsg.innerHTML = `<span style="color: var(--primary-600); display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('refresh')} កំពុងធ្វើតេស្តការតភ្ជាប់...</span>`;
      const res = await CloudflareService.testConnection(url, key);
      if (res.success) {
        statusMsg.innerHTML = `<span style="color: var(--success-600); display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('checkCircle')} ${res.message}</span>`;
      } else {
        statusMsg.innerHTML = `<span style="color: var(--danger-600); display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('alertCircle')} ${res.message}</span>`;
      }
    });

    // Save CF settings
    tabContainer.querySelector('#btn-save-cf-settings')?.addEventListener('click', () => {
      StorageService.saveSettings({
        cfWorkerUrl: urlInput.value.trim(),
        cfApiKey: keyInput.value.trim()
      });
      showToast('បានរក្សាទុកការកំណត់ Cloudflare រួចរាល់!', 'success');
    });

    // Push to CF
    tabContainer.querySelector('#btn-push-to-cf')?.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();
      const exams = StorageService.getExams();
      const questions = StorageService.getQuestions();

      if (!url) {
        showToast('សូមកំណត់ Cloudflare Worker URL ជាមុនសិន!', 'error');
        return;
      }

      showToast('កំពុងបញ្ជូនទិន្នន័យទៅ Cloudflare...', 'info');
      const res = await CloudflareService.pushData(url, key, { exams, questions });
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    });

    // Pull from CF
    tabContainer.querySelector('#btn-pull-from-cf')?.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();

      if (!url) {
        showToast('សូមកំណត់ Cloudflare Worker URL ជាមុនសិន!', 'error');
        return;
      }

      showToast('កំពុងទាញទិន្នន័យពី Cloudflare...', 'info');
      const res = await CloudflareService.pullData(url, key);
      if (res.success) {
        if (res.exams && res.exams.length > 0) {
          res.exams.forEach(e => StorageService.saveExam(e));
        }
        if (res.questions && res.questions.length > 0) {
          res.questions.forEach(q => StorageService.saveQuestion(q));
        }
        showToast(`បានទាញយកវិញ្ញាសា ${res.exams.length} និងសំណួរ ${res.questions.length} ជោគជ័យ!`, 'success');
        refreshApp();
      } else {
        showToast(res.message, 'error');
      }
    });

    // Export JSON
    tabContainer.querySelector('#btn-export-json')?.addEventListener('click', () => {
      const json = StorageService.exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `triem-krobkhand-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(dlUrl);
      showToast('បានទាញយក File បម្រុងទុក JSON រួចរាល់!', 'success');
    });

    // Import JSON
    tabContainer.querySelector('#input-import-json')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const res = StorageService.importData(loadEvt.target.result);
          if (res.success) {
            showToast(`បានបញ្ចូលទិន្នន័យជោគជ័យ! (វិញ្ញាសា: ${res.countExams}, សំណួរ: ${res.countQuestions})`, 'success');
            refreshApp();
          } else {
            showToast('បរាជ័យក្នុងការ Import៖ ' + res.error, 'error');
          }
        };
        reader.readAsText(file);
      }
    });

    // Clear all data
    tabContainer.querySelector('#btn-reset-sample')?.addEventListener('click', () => {
      if (confirm('តើអ្នកពិតជាចង់សម្អាតទិន្នន័យទាំងអស់ (វិញ្ញាសា និងសំណួរ) មែនទេ?')) {
        StorageService.setAllExams([]);
        StorageService.setAllQuestions([]);
        showToast('បានសម្អាតទិន្នន័យទាំងអស់រួចរាល់!', 'success');
        refreshApp();
      }
    });
  }

  // ==========================================
  // 4. ADMIN ACCOUNT MANAGEMENT TAB
  // ==========================================
  function renderAccountManager(tabContainer) {
    const admin = StorageService.getAdminAccount();

    tabContainer.innerHTML = `
      <div style="max-width: 650px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Card 1: Cloudflare D1 Form -->
        <div class="admin-form-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; margin: 0;">
              <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('shield')}</span>
              <span>គ្រប់គ្រងគណនី Admin (Cloudflare D1 Database)</span>
            </h3>
            <span style="font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); background: rgba(16, 185, 129, 0.1); color: #059669; font-weight: 600;">
              សុវត្ថិភាព 100%
            </span>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.5;">
            Email និង Password របស់ Admin ត្រូវបានរក្សាទុកដោយផ្ទាល់ក្នុង <strong>Cloudflare D1 Database (table: system_config)</strong>។ គ្មានរក្សាទុកពាក្យសម្ងាត់លើកូដកម្មវិធី (Source Code) ឡើយ។
          </p>

          <form id="admin-account-form">
            <div class="form-group" style="margin-bottom: 0.9rem;">
              <label class="form-label">ឈ្មោះសម្គាល់ Admin</label>
              <input type="text" id="admin-name-input" class="form-input" value="${admin.name || 'រដ្ឋបាលប្រព័ន្ធ (Admin)'}" required />
            </div>

            <div class="form-group" style="margin-bottom: 0.9rem;">
              <label class="form-label">Email របស់ Admin *</label>
              <input type="email" id="admin-email-input" class="form-input" placeholder="ឧ. yourname@gmail.com" value="${admin.email || ''}" required />
            </div>

            <div class="form-group" style="margin-bottom: 0.9rem;">
              <label class="form-label">ពាក្យសម្ងាត់បច្ចុប្បន្ន (Current Password)</label>
              <input type="password" id="admin-current-pwd-input" class="form-input" placeholder="បំពេញប្រសិនបើគណនី Admin មានរួចហើយក្នុង D1..." />
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                ប្រសិនបើនេះជាការបង្កើតដំបូង មិនបាច់បំពេញប្រអប់នេះទេ។
              </p>
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label">ពាក្យសម្ងាត់ថ្មី (New Password) *</label>
              <input type="text" id="admin-password-input" class="form-input" placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី..." required />
            </div>

            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button type="submit" id="btn-save-admin-d1" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.65rem 1.25rem;">
                ${getIcon('save')} <span>រក្សាទុកក្នុង Cloudflare D1</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Card 2: Direct SQL in Cloudflare D1 Console -->
        <div class="admin-form-card" style="border: 1px solid rgba(37, 99, 235, 0.2); background: rgba(37, 99, 235, 0.02);">
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.45rem;">
            <span style="color: var(--primary-600); display: inline-flex;">${getIcon('database')}</span>
            <span>បញ្ចូលតាមរយៈ Cloudflare D1 Console ដោយផ្ទាល់ (Direct SQL)</span>
          </h4>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.75rem;">
            អ្នកក៏អាចចូលទៅកាន់ Cloudflare Dashboard &gt; Workers &amp; Pages &gt; D1 &gt; <strong>triem-krobkhand-db</strong> &gt; <strong>Console</strong> រួច Copy កូដ SQL ខាងក្រោមនេះទៅ Paste ដើម្បីបញ្ចូល ឬផ្លាស់ប្តូរ Email និង Password Admin បានភ្លាមៗ៖
          </p>

          <pre id="admin-sql-code" style="background: var(--bg-dark, #1e293b); color: #f8fafc; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; line-height: 1.5; overflow-x: auto; font-family: monospace; margin-bottom: 0.75rem;">INSERT INTO system_config (key, value)
VALUES ('admin_account', '{"name":"Admin","email":"admin@example.com","password":"your_password_here"}')
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;</pre>

          <div style="display: flex; justify-content: flex-end;">
            <button type="button" id="btn-copy-sql" class="btn-secondary" style="font-size: 0.82rem; padding: 0.4rem 0.85rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('fileText')} <span>ចម្លងកូដ SQL (Copy SQL)</span>
            </button>
          </div>
        </div>
      </div>
    `;

    tabContainer.querySelector('#btn-copy-sql')?.addEventListener('click', () => {
      const sql = tabContainer.querySelector('#admin-sql-code').textContent;
      navigator.clipboard.writeText(sql).then(() => {
        showToast('បានចម្លងកូដ SQL ទៅកាន់ Clipboard រួចរាល់!', 'success');
      }).catch(() => {
        showToast('មិនអាចចម្លងបានទេ សូម Select copy ដោយផ្ទាល់', 'info');
      });
    });

    tabContainer.querySelector('#admin-account-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = tabContainer.querySelector('#btn-save-admin-d1');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'កំពុងរក្សាទុកក្នុង D1...';
      }

      const name = tabContainer.querySelector('#admin-name-input').value.trim();
      const email = tabContainer.querySelector('#admin-email-input').value.trim();
      const currentPassword = tabContainer.querySelector('#admin-current-pwd-input').value.trim();
      const password = tabContainer.querySelector('#admin-password-input').value.trim();

      if (!email || !password) {
        showToast('សូមបំពេញ Email និង Password!', 'error');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `${getIcon('save')} <span>រក្សាទុកក្នុង Cloudflare D1</span>`;
        }
        return;
      }

      const res = await StorageService.updateAdminAccount({ name, email, password, currentPassword });
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `${getIcon('save')} <span>រក្សាទុកក្នុង Cloudflare D1</span>`;
      }

      if (res.success) {
        showToast('បានរក្សាទុកគណនី Admin ក្នុង Cloudflare D1 Database ជោគជ័យ!', 'success');
        render();
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // ==========================================
  // 5. USERS & CANDIDATES MANAGEMENT TAB
  // ==========================================
  async function renderUsersManager(tabContainer, settings) {
    let filterProvider = 'all'; // 'all', 'google', 'email'
    let searchTerm = '';
    let usersList = [];
    let stats = { total: 0, google: 0, email: 0 };

    tabContainer.innerHTML = `
      <div class="admin-form-card" style="text-align: center; padding: 3rem 1rem;">
        <div style="width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--primary-600); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 0.75rem;"></div>
        <p style="color: var(--text-muted); font-size: 0.9rem;">កំពុងទាញទិន្នន័យអ្នកប្រើប្រាស់ពី Cloudflare D1...</p>
      </div>
    `;

    async function loadData() {
      const localUsers = StorageService.getUsers() || [];
      if (settings.cfWorkerUrl) {
        try {
          const res = await CloudflareService.getUsers(settings.cfWorkerUrl, settings.cfApiKey);
          if (res && res.success && Array.isArray(res.users)) {
            usersList = res.users;
            stats.total = res.totalCount ?? res.users.length;
            stats.google = res.googleCount ?? res.users.filter(u => u.provider === 'google').length;
            stats.email = res.emailCount ?? res.users.filter(u => u.provider !== 'google').length;
            renderView();
            return;
          }
        } catch (e) {
          console.warn('Error fetching users from Cloudflare D1:', e);
        }
      }

      // Fallback to local users
      usersList = localUsers;
      stats.total = localUsers.length;
      stats.google = localUsers.filter(u => u.provider === 'google').length;
      stats.email = localUsers.filter(u => u.provider !== 'google').length;
      renderView();
    }

    function renderView() {
      const filtered = usersList.filter(u => {
        const matchesProvider = filterProvider === 'all' || 
          (filterProvider === 'google' && u.provider === 'google') ||
          (filterProvider === 'email' && u.provider !== 'google');

        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term || 
          (u.name && u.name.toLowerCase().includes(term)) ||
          (u.email && u.email.toLowerCase().includes(term)) ||
          (u.targetMinistry && u.targetMinistry.toLowerCase().includes(term));

        return matchesProvider && matchesSearch;
      });

      tabContainer.innerHTML = `
        <!-- Stats Metric Row -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <!-- Card 1: Total Users -->
          <div class="admin-form-card" style="margin-bottom: 0; padding: 1.25rem; border-left: 4px solid var(--primary-600); display: flex; align-items: center; gap: 1rem;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(37, 99, 235, 0.1); color: var(--primary-600); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${getIcon('users')}
            </div>
            <div>
              <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">សរុបអ្នកប្រើប្រាស់ (Total Users)</div>
              <div style="font-size: 1.65rem; font-weight: 700; color: var(--text-primary); line-height: 1.2;">
                ${stats.total}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">គណនីក្នុង Database D1</div>
            </div>
          </div>

          <!-- Card 2: Google Accounts -->
          <div class="admin-form-card" style="margin-bottom: 0; padding: 1.25rem; border-left: 4px solid #ea4335; display: flex; align-items: center; gap: 1rem;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(234, 67, 53, 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
            <div>
              <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">គណនី Google (Google Auth)</div>
              <div style="font-size: 1.65rem; font-weight: 700; color: #ea4335; line-height: 1.2;">
                ${stats.google}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">ភ្ជាប់តាមរយៈ Google</div>
            </div>
          </div>

          <!-- Card 3: Email Accounts -->
          <div class="admin-form-card" style="margin-bottom: 0; padding: 1.25rem; border-left: 4px solid #10b981; display: flex; align-items: center; gap: 1rem;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.1); color: #10b981; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${getIcon('mail')}
            </div>
            <div>
              <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">គណនី Email &amp; Password</div>
              <div style="font-size: 1.65rem; font-weight: 700; color: #10b981; line-height: 1.2;">
                ${stats.email}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">ចុះឈ្មោះដោយ Email</div>
            </div>
          </div>
        </div>

        <!-- Firebase & Google Auth Setup Card in Cloudflare D1 -->
        <div class="admin-form-card" style="margin-bottom: 1.5rem; border-left: 4px solid #f59e0b;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div>
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#FFCA28" d="M3.89 15.672L6.255.461A.542.542 0 0 1 7.27.284l3.542 6.64-6.922 8.748z"/>
                  <path fill="#FFA000" d="M.158 19.32l.84-5.38 6.924 8.748L.74 20.31a.88.88 0 0 1-.582-.99z"/>
                  <path fill="#F57C00" d="M11.968 13.918l2.257-4.28 1.942-3.69a.54.54 0 0 1 .986.11l2.97 16.59-8.155-8.73z"/>
                  <path fill="#FFCA28" d="M20.123 22.648L17.153 6.058l-1.942 3.69-3.243 6.17 8.155 6.73z"/>
                </svg>
                <span>ការកំណត់ Firebase &amp; Google Sign-In (Cloudflare D1 Database)</span>
              </h4>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">
                ចម្លងកូដ <code>firebaseConfig</code> ទាំងមូលពី Firebase Console (គម្រោង <strong>DB-DATA-FB</strong>) មកដាក់ទីនេះ ដើម្បីឱ្យបេក្ខជនចុច Login ជាមួយ Google Account ផ្ទាល់បានភ្លាមៗ!
              </p>
            </div>
            <span style="font-size: 0.78rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: var(--radius-full); background: ${(settings.firebaseConfig?.apiKey || settings.googleClientId) ? '#dcfce7' : '#fee2e2'}; color: ${(settings.firebaseConfig?.apiKey || settings.googleClientId) ? '#15803d' : '#b91c1c'};">
              ${(settings.firebaseConfig?.apiKey) ? `បានភ្ជាប់ Firebase (${settings.firebaseConfig.projectId || 'Active'})` : (settings.googleClientId ? 'បានភ្ជាប់ Client ID' : 'មិនទាន់បានកំណត់')}
            </span>
          </div>

          <!-- Quick Guide -->
          <div style="background: var(--bg-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.9rem; line-height: 1.5; border-left: 3px solid var(--primary-600);">
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
              របៀបយកកូដពី Firebase Console (គម្រោង DB-DATA-FB)៖
            </div>
            1. ចូល Firebase Console &gt; ចុចលើសញ្ញាកង់ធ្មេញ ⚙️ <strong>Project settings</strong><br/>
            2. អូសចុះក្រោមត្រង់កន្លែង <strong>Your apps (Web app)</strong><br/>
            3. <strong>Copy (ចម្លង) កូដ <code>const firebaseConfig = { ... };</code> ទាំងមូល</strong> រួចយកមក Paste ក្នុងប្រអប់ខាងក្រោមនេះ!
          </div>

          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem;">
              <span>កូដ Firebase Config (Paste កូដទាំងមូល ឬ JSON នៅទីនេះ) *</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">ប្រព័ន្ធចាប់យក apiKey, authDomain, projectId ដោយស្វ័យប្រវត្តិ</span>
            </label>
            <textarea id="input-admin-firebase-raw" class="form-textarea" style="min-height: 120px; font-family: monospace; font-size: 0.82rem; line-height: 1.45; background: var(--bg-card);" placeholder="Paste កូដ firebaseConfig ឬ JSON នៅទីនេះ...&#10;ឧទាហរណ៍៖&#10;const firebaseConfig = {&#10;  apiKey: &quot;AIzaSyC_pcL4lrh...&quot;,&#10;  authDomain: &quot;db-data-fb-....firebaseapp.com&quot;,&#10;  projectId: &quot;db-data-fb-...&quot;,&#10;  storageBucket: &quot;db-data-fb-...appspot.com&quot;,&#10;  messagingSenderId: &quot;737156289652&quot;,&#10;  appId: &quot;1:737156289652:web:...&quot;&#10;};">${settings.firebaseConfig ? JSON.stringify(settings.firebaseConfig, null, 2) : (settings.googleClientId || '')}</textarea>
          </div>

          ${settings.firebaseConfig?.apiKey ? `
            <div style="margin-bottom: 0.75rem; padding: 0.65rem 0.85rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.2rem;">
              <div style="font-weight: 600; color: #059669; display: flex; align-items: center; gap: 0.35rem;">
                ${getIcon('checkCircle')} <span>ទិន្នន័យ Firebase កំពុងដំណើរការក្នុងប្រព័ន្ធ៖</span>
              </div>
              <div style="color: var(--text-secondary); font-family: monospace; font-size: 0.78rem;">
                • Project ID: <strong>${settings.firebaseConfig.projectId || 'db-data-fb'}</strong><br/>
                • Auth Domain: <strong>${settings.firebaseConfig.authDomain || '—'}</strong><br/>
                • API Key: <strong>${settings.firebaseConfig.apiKey ? settings.firebaseConfig.apiKey.slice(0, 14) + '...' : '—'}</strong>
              </div>
            </div>
          ` : ''}

          <!-- Authorized Domains Reminder Alert -->
          <div style="margin-bottom: 0.75rem; padding: 0.75rem 1rem; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5;">
            <strong style="color: #d97706; display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;">
              ${getIcon('alertCircle')} សំខាន់ខ្លាំង (Authorized domains ក្នុង Firebase)៖
            </strong>
            ដើម្បីឱ្យ Google អនុញ្ញាតឱ្យចូលគណនីលើ Website របស់យើង សូមចូល Firebase Console &gt; <strong>Authentication</strong> &gt; Tab <strong>Settings</strong> &gt; <strong>Authorized domains</strong> &gt; ចុច <strong>Add domain</strong> រួចបញ្ចូល៖<br/>
            <code style="background: rgba(0,0,0,0.06); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 600; color: #b45309; display: inline-block; margin-top: 0.25rem; font-family: monospace;">bonchantha57-ux.github.io</code>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.2rem;">(និង <code>localhost</code> ប្រសិនបើតេស្តលើកុំព្យូទ័រផ្ទាល់)</span>
          </div>

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button type="button" id="btn-admin-save-firebase-config" class="btn-primary" style="padding: 0.6rem 1.25rem; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${getIcon('save')} <span>រក្សាទុក Firebase Config ក្នុង Cloudflare D1</span>
            </button>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="admin-form-card" style="margin-bottom: 1.25rem; padding: 1rem 1.25rem;">
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between;">
            <!-- Search -->
            <div style="position: relative; flex: 1; min-width: 240px;">
              <span style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: inline-flex;">
                ${getIcon('search')}
              </span>
              <input type="text" id="users-search-input" class="form-input" placeholder="ស្វែងរកតាមឈ្មោះ, Email ឬស្ថាប័ន..." value="${searchTerm}" style="padding-left: 2.5rem;" />
            </div>

            <!-- Provider Filter Pills -->
            <div style="display: flex; gap: 0.35rem; background: var(--bg-subtle); padding: 0.25rem; border-radius: var(--radius-full);">
              <button type="button" class="btn-filter-provider ${filterProvider === 'all' ? 'active' : ''}" data-provider="all" style="padding: 0.35rem 0.85rem; font-size: 0.82rem; border-radius: var(--radius-full); border: none; cursor: pointer; background: ${filterProvider === 'all' ? 'var(--bg-card)' : 'transparent'}; color: ${filterProvider === 'all' ? 'var(--primary-600)' : 'var(--text-secondary)'}; font-weight: 600; box-shadow: ${filterProvider === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
                ទាំងអស់ (${stats.total})
              </button>
              <button type="button" class="btn-filter-provider ${filterProvider === 'google' ? 'active' : ''}" data-provider="google" style="padding: 0.35rem 0.85rem; font-size: 0.82rem; border-radius: var(--radius-full); border: none; cursor: pointer; background: ${filterProvider === 'google' ? 'var(--bg-card)' : 'transparent'}; color: ${filterProvider === 'google' ? 'var(--primary-600)' : 'var(--text-secondary)'}; font-weight: 600; box-shadow: ${filterProvider === 'google' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
                Google (${stats.google})
              </button>
              <button type="button" class="btn-filter-provider ${filterProvider === 'email' ? 'active' : ''}" data-provider="email" style="padding: 0.35rem 0.85rem; font-size: 0.82rem; border-radius: var(--radius-full); border: none; cursor: pointer; background: ${filterProvider === 'email' ? 'var(--bg-card)' : 'transparent'}; color: ${filterProvider === 'email' ? 'var(--primary-600)' : 'var(--text-secondary)'}; font-weight: 600; box-shadow: ${filterProvider === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
                Email (${stats.email})
              </button>
            </div>

            <!-- Refresh Button -->
            <button type="button" id="btn-refresh-users" class="btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 0.85rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              <span>ទាញទិន្នន័យឡើងវិញ</span>
            </button>
          </div>
        </div>

        <!-- Users Table -->
        <div class="admin-form-card" style="padding: 0; overflow: hidden;">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
              <thead>
                <tr style="background: var(--bg-subtle); border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">
                  <th style="padding: 0.85rem 1rem;">#</th>
                  <th style="padding: 0.85rem 1rem;">បេក្ខជន / អ្នកប្រើប្រាស់</th>
                  <th style="padding: 0.85rem 1rem;">Email</th>
                  <th style="padding: 0.85rem 1rem;">ប្រភេទគណនី</th>
                  <th style="padding: 0.85rem 1rem;">ស្ថាប័នរដ្ឋគោលដៅ</th>
                  <th style="padding: 0.85rem 1rem;">កាលបរិច្ឆេទចុះឈ្មោះ</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="7" style="padding: 3rem 1rem; text-align: center; color: var(--text-muted);">
                      <div style="margin-bottom: 0.5rem; display: inline-flex; color: var(--text-muted); opacity: 0.6;">
                        ${getIcon('users')}
                      </div>
                      <p>មិនមានអ្នកប្រើប្រាស់ណាម្នាក់ត្រូវនឹងការស្វែងរកនេះឡើយ។</p>
                    </td>
                  </tr>
                ` : filtered.map((u, idx) => {
                  const isGoogle = u.provider === 'google';
                  const avatarSrc = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=${isGoogle ? '4285F4' : '6366f1'}&color=fff&bold=true`;
                  const regDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'ថ្មីៗ';

                  return `
                    <tr style="border-bottom: 1px solid var(--border-color); transition: background var(--transition-fast);">
                      <td style="padding: 0.85rem 1rem; color: var(--text-muted); font-size: 0.8rem;">${idx + 1}</td>
                      <td style="padding: 0.85rem 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                          <img src="${avatarSrc}" alt="${u.name || 'User'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid ${isGoogle ? '#4285F4' : 'var(--border-color)'}; flex-shrink: 0;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=6366f1&color=fff';" />
                          <div>
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${u.name || 'បេក្ខជន'}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${u.role === 'admin' ? 'រដ្ឋបាល (Admin)' : 'បេក្ខជន'}</div>
                          </div>
                        </div>
                      </td>
                      <td style="padding: 0.85rem 1rem; color: var(--text-secondary); font-family: monospace; font-size: 0.85rem;">
                        ${u.email}
                      </td>
                      <td style="padding: 0.85rem 1rem;">
                        ${isGoogle ? `
                          <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 600; background: rgba(234, 67, 53, 0.08); color: #ea4335; border: 1px solid rgba(234, 67, 53, 0.25);">
                            <svg width="14" height="14" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                            </svg>
                            Google
                          </span>
                        ` : `
                          <span style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 600; background: rgba(16, 185, 129, 0.08); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);">
                            ${getIcon('mail')} Email
                          </span>
                        `}
                      </td>
                      <td style="padding: 0.85rem 1rem; color: var(--text-secondary); font-size: 0.85rem;">
                        ${u.targetMinistry || 'សាលាភូមិន្ទរដ្ឋបាល (ERA)'}
                      </td>
                      <td style="padding: 0.85rem 1rem; color: var(--text-muted); font-size: 0.82rem;">
                        ${regDate}
                      </td>
                      <td style="padding: 0.85rem 1rem; text-align: right;">
                        <button type="button" class="btn-delete-user" data-id="${u.id}" data-email="${u.email}" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; color: var(--danger, #ef4444); background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-md); cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;" title="លុបអ្នកប្រើប្រាស់">
                          ${getIcon('trash')} <span>លុប</span>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Event Listeners
      const searchInput = tabContainer.querySelector('#users-search-input');
      searchInput?.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderView();
        const updatedInput = tabContainer.querySelector('#users-search-input');
        if (updatedInput) {
          updatedInput.focus();
          updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
        }
      });

      tabContainer.querySelector('#btn-admin-save-firebase-config')?.addEventListener('click', async () => {
        const val = tabContainer.querySelector('#input-admin-firebase-raw')?.value.trim();
        if (!val) {
          showToast('សូម Paste កូដ firebaseConfig ឬ JSON ពី Firebase Console!', 'error');
          return;
        }

        const parsed = parseFirebaseConfigInput(val);
        if (!parsed) {
          showToast('មិនអាចស្គាល់ទម្រង់កូដ Firebase នេះទេ! សូម Copy ទាំងមូលពី Firebase Console (const firebaseConfig = { ... })', 'error');
          return;
        }

        const saveBtn = tabContainer.querySelector('#btn-admin-save-firebase-config');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerHTML = 'កំពុងរក្សាទុកក្នុង Cloudflare D1...';
        }

        showToast('កំពុងរក្សាទុកការកំណត់ Firebase ក្នុង Cloudflare D1...', 'info');
        const updatedSettings = {
          firebaseConfig: parsed,
          googleClientId: parsed.googleClientId || parsed.apiKey || ''
        };
        StorageService.saveSettings(updatedSettings);

        if (settings.cfWorkerUrl) {
          try {
            await CloudflareService.saveFirebaseConfig(parsed, settings.cfWorkerUrl, settings.cfApiKey);
          } catch (e) {
            console.warn('Notice saving firebase config to D1:', e);
          }
        }

        showToast(`បានរក្សាទុក Firebase Config (${parsed.projectId || 'Active'}) ក្នុង Cloudflare D1 ជោគជ័យ!`, 'success');
        settings.firebaseConfig = parsed;
        settings.googleClientId = updatedSettings.googleClientId;
        renderView();
      });

      tabContainer.querySelectorAll('.btn-filter-provider').forEach(btn => {
        btn.addEventListener('click', () => {
          filterProvider = btn.dataset.provider;
          renderView();
        });
      });

      tabContainer.querySelector('#btn-refresh-users')?.addEventListener('click', () => {
        showToast('កំពុងទាញទិន្នន័យឡើងវិញពី Cloudflare D1...', 'info');
        loadData();
      });

      tabContainer.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const email = btn.dataset.email;
          if (confirm(`តើអ្នកពិតជាចង់លុបគណនីបេក្ខជន ${email} នេះមែនទេ?`)) {
            showToast('កំពុងលុបអ្នកប្រើប្រាស់...', 'info');
            if (settings.cfWorkerUrl) {
              await CloudflareService.deleteUser(id, settings.cfWorkerUrl, settings.cfApiKey);
            }
            let currentLocal = StorageService.getUsers();
            currentLocal = currentLocal.filter(u => u.id !== id && u.email !== email);
            localStorage.setItem('triem_krobkhand_users_v1', JSON.stringify(currentLocal));
            showToast('បានលុបអ្នកប្រើប្រាស់ដោយជោគជ័យ!', 'success');
            loadData();
          }
        });
      });
    }

    loadData();
  }

  render();
}
