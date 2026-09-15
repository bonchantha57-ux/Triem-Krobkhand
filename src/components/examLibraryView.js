import { MINISTRIES, CATEGORIES } from '../data/defaultData.js';
import { StorageService } from '../services/storage.js';
import { getIcon } from '../utils/icons.js';

export function renderExamLibraryView(container, filterState = {}, openExamModal) {
  let selectedMinistry = filterState.ministry || 'all';
  let selectedCategory = 'all';
  let searchQuery = '';
  const activeCategories = StorageService.getActiveCategories();
  const activeMinistries = StorageService.getActiveMinistries();

  function renderList() {
    const gridContainer = container.querySelector('#exams-cards-container');
    if (!gridContainer) return;

    const allExams = StorageService.getExams();

    if (allExams.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px dashed var(--border-color);">
          <div style="display: flex; justify-content: center; margin-bottom: 0.75rem; color: var(--primary-600);">${getIcon('book')}</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">មិនទាន់មានវិញ្ញាសាប្រឡងនៅឡើយទេ</h3>
          <p style="font-size: 0.88rem; color: var(--text-muted); max-width: 340px; margin: 0 auto;">វិញ្ញាសានឹងបង្ហាញនៅទីនេះ ពេល Admin ចាប់ផ្តើមបញ្ចូលវិញ្ញាសាថ្មី។</p>
        </div>
      `;
      return;
    }

    const filtered = allExams.filter(exam => {
      const matchMinistry = selectedMinistry === 'all' || exam.ministryId === selectedMinistry;
      const matchCategory = selectedCategory === 'all' || exam.categoryId === selectedCategory;
      const matchSearch = !searchQuery || 
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exam.tags && exam.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchMinistry && matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: center; margin-bottom: 0.75rem; color: var(--text-muted);">${getIcon('search')}</div>
          <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">រកមិនឃើញវិញ្ញាសាទេ</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">សូមសាកល្បងស្វែងរកពាក្យគន្លឹះផ្សេង ឬដោះការច្រោះចេញ។</p>
          <button id="btn-reset-filters" class="btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem;">បង្ហាញវិញ្ញាសាទាំងអស់</button>
        </div>
      `;
      gridContainer.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
        selectedMinistry = 'all';
        selectedCategory = 'all';
        searchQuery = '';
        container.querySelector('#search-input').value = '';
        updateUI();
      });
      return;
    }

    gridContainer.innerHTML = filtered.map(exam => {
      const isBookmarked = StorageService.isBookmarked(exam.id);
      return `
        <div class="exam-card" data-id="${exam.id}">
          <div style="position: relative;">
            <img class="exam-card-image" src="${exam.imageUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80'}" alt="${exam.title}" loading="lazy" />
            <button class="icon-btn btn-bookmark" data-id="${exam.id}" title="រក្សាទុក" style="position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(4px); box-shadow: var(--shadow-sm); display: inline-flex; align-items: center; justify-content: center;">
              ${isBookmarked ? getIcon('starFilled') : getIcon('star')}
            </button>
          </div>
          <div class="exam-card-content">
            <div class="exam-meta-bar">
              <span class="exam-badge">${exam.ministryName || 'ក្របខ័ណ្ឌរដ្ឋ'}</span>
              <span class="exam-year">ឆ្នាំ ${exam.year || '2024'}</span>
            </div>
            <h4 class="exam-title">${exam.title}</h4>
            <p class="exam-desc">${exam.description || 'វិញ្ញាសាស្តង់ដារសម្រាប់ការប្រឡងចូលក្របខ័ណ្ឌរដ្ឋ'}</p>
            <div class="exam-footer">
              <span style="display: inline-flex; align-items: center; gap: 0.35rem;">${getIcon('timer')} ${exam.durationMinutes || 60} នាទី • ${exam.difficulty || 'មធ្យម'}</span>
              <button class="exam-details-btn btn-read-exam" data-id="${exam.id}">អានវិញ្ញាសា</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Reattach listeners
    gridContainer.querySelectorAll('.btn-read-exam').forEach(btn => {
      btn.addEventListener('click', () => {
        const exam = allExams.find(x => x.id === btn.dataset.id);
        if (exam) openExamModal(exam);
      });
    });

    gridContainer.querySelectorAll('.btn-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const state = StorageService.toggleBookmark(id);
        btn.innerHTML = state ? getIcon('starFilled') : getIcon('star');
      });
    });
  }

  function updateUI() {
    // Update active category pill
    container.querySelectorAll('.pill-item').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.cat === selectedCategory);
    });
    // Update ministry select
    const select = container.querySelector('#ministry-select');
    if (select) select.value = selectedMinistry;

    renderList();
  }

  container.innerHTML = `
    <!-- Top Search & Filter Bar -->
    <div style="margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.4rem;">
            <span style="color: var(--primary-600); display: inline-flex; align-items: center;">${getIcon('book')}</span>
            <span>បណ្ណាល័យវិញ្ញាសាប្រឡង</span>
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            វិញ្ញាសាចាស់ៗ និងវិញ្ញាសាជ្រើសរើសពិសេសសម្រាប់ក្របខ័ណ្ឌរដ្ឋគ្រប់ស្ថាប័ន
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <select id="ministry-select" class="form-select" style="width: auto; min-width: 180px; padding: 0.5rem 0.8rem; font-size: 0.88rem; font-weight: 600;">
            <option value="all">គ្រប់ស្ថាប័នទាំងអស់</option>
            ${activeMinistries.map(m => `
              <option value="${m.id}" ${m.id === selectedMinistry ? 'selected' : ''}>${m.name}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Search Input -->
      <div style="position: relative; margin-bottom: 1rem;">
        <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: inline-flex; align-items: center;">
          ${getIcon('search')}
        </span>
        <input 
          id="search-input" 
          type="text" 
          class="form-input" 
          placeholder="ស្វែងរកតាមចំណងជើងវិញ្ញាសា ស្ថាប័ន ឬពាក្យគន្លឹះ..." 
          style="padding-left: 2.8rem; border-radius: var(--radius-full); height: 46px;"
        />
      </div>

      <!-- Category Pills (Horizontally swipeable on phone with nav arrows) -->
      ${activeCategories.length > 0 ? `
        <div class="category-pills-wrapper">
          <button type="button" class="pill-nav-btn pill-nav-prev" id="btn-pills-prev" aria-label="Previous" style="display: none;">
            ${getIcon('arrowLeft')}
          </button>
          <div class="category-pills" id="category-pills-row" tabindex="0">
            <button class="pill-item ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">
              ទាំងអស់
            </button>
            ${activeCategories.map(cat => `
              <button class="pill-item ${selectedCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
                <span class="pill-icon">${getIcon('book')}</span>
                <span>${cat.name}</span>
              </button>
            `).join('')}
          </div>
          <button type="button" class="pill-nav-btn pill-nav-next" id="btn-pills-next" aria-label="Next">
            ${getIcon('arrowRight')}
          </button>
        </div>
      ` : `
        <div style="padding: 0.6rem 0.5rem; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
          <span>${getIcon('info')}</span>
          <span>មិនទាន់មានមុខវិជ្ជាត្រូវបានបញ្ចូលនៅឡើយទេ (រង់ចាំ Admin បញ្ចូលវិញ្ញាសា)</span>
        </div>
      `}
    </div>

    <!-- Exam Cards Grid -->
    <div id="exams-cards-container" class="exams-grid"></div>
  `;

  // Search input event
  const searchInput = container.querySelector('#search-input');
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderList();
  });

  // Ministry select event
  const ministrySelect = container.querySelector('#ministry-select');
  ministrySelect?.addEventListener('change', (e) => {
    selectedMinistry = e.target.value;
    renderList();
  });

  // Setup smooth touch swipe, mouse drag, wheel scroll, and arrow navigation for Category Pills
  const pillsSlider = container.querySelector('#category-pills-row');
  const btnPrev = container.querySelector('#btn-pills-prev');
  const btnNext = container.querySelector('#btn-pills-next');

  function updateArrowVisibility() {
    if (!pillsSlider || !btnPrev || !btnNext) return;
    const maxScroll = pillsSlider.scrollWidth - pillsSlider.clientWidth;
    btnPrev.style.display = pillsSlider.scrollLeft > 8 ? 'flex' : 'none';
    btnNext.style.display = (maxScroll - pillsSlider.scrollLeft) > 8 ? 'flex' : 'none';
  }

  if (pillsSlider) {
    pillsSlider.addEventListener('scroll', updateArrowVisibility, { passive: true });
    setTimeout(updateArrowVisibility, 150);
    window.addEventListener('resize', updateArrowVisibility);

    // Prev / Next Arrow buttons
    btnPrev?.addEventListener('click', () => {
      pillsSlider.scrollBy({ left: -180, behavior: 'smooth' });
    });
    btnNext?.addEventListener('click', () => {
      pillsSlider.scrollBy({ left: 180, behavior: 'smooth' });
    });

    // Horizontal wheel scroll
    pillsSlider.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        e.preventDefault();
        pillsSlider.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // Touch and mouse drag variables
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let hasMoved = false;

    // Mouse Drag
    pillsSlider.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasMoved = false;
      startX = e.pageX;
      scrollStart = pillsSlider.scrollLeft;
      pillsSlider.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) {
        hasMoved = true;
      }
      pillsSlider.scrollLeft = scrollStart - dx;
    });

    const stopMouseDrag = () => {
      if (!isDown) return;
      isDown = false;
      pillsSlider.classList.remove('is-dragging');
    };
    window.addEventListener('mouseup', stopMouseDrag);

    // Mobile Touch Gesture Support
    let touchStartX = 0;
    let touchStartY = 0;
    let touchScrollStart = 0;

    pillsSlider.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchScrollStart = pillsSlider.scrollLeft;
      hasMoved = false;
    }, { passive: true });

    pillsSlider.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
        hasMoved = true;
        pillsSlider.scrollLeft = touchScrollStart - dx;
      }
    }, { passive: true });

    // Category pills click handler (prevents firing if dragged)
    pillsSlider.querySelectorAll('.pill-item').forEach(pill => {
      pill.addEventListener('click', (e) => {
        if (hasMoved) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        selectedCategory = pill.dataset.cat;
        updateUI();
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    });
  }

  renderList();
}
