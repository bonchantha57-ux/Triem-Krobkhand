import { DEFAULT_EXAMS, DEFAULT_QUESTIONS } from '../data/defaultData.js';
import { CloudflareService } from './cloudflareApi.js';

const STORAGE_KEYS = {
  EXAMS: 'triem_exams_v2',
  QUESTIONS: 'triem_questions_v2',
  RESULTS: 'triem_quiz_results_v2',
  BOOKMARKS: 'triem_bookmarks_v2',
  SETTINGS: 'triem_settings_v2',
  PROFILE: 'triem_profile_v2',
  AUTH: 'triem_current_user_v2',
  USERS: 'triem_users_db_v2'
};

// Zero credentials in source code!
// Admin credentials are now stored and authenticated securely in Cloudflare D1 Database (table: system_config).
const DEFAULT_USERS = [];

export const DEFAULT_WORKER_URL = 'https://triem-krobkhand-api.bonchantha57.workers.dev';

export const StorageService = {
  init() {
    // Clear legacy v1 demo data if present to ensure completely fresh clean slate
    if (localStorage.getItem('triem_exams_v1')) {
      localStorage.removeItem('triem_exams_v1');
      localStorage.removeItem('triem_questions_v1');
    }

    // Start with empty exams and questions until Admin adds them
    if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      const defaultSettings = {
        theme: 'light',
        fontSize: 'medium',
        sound: true,
        cfWorkerUrl: DEFAULT_WORKER_URL,
        cfApiKey: '',
        cfAutoSync: true
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      const defaultProfile = {
        name: 'បេក្ខជន ត្រៀមប្រឡង',
        targetMinistry: 'សាលាភូមិន្ទរដ្ឋបាល (ERA)',
        targetYear: '២០២៥-២០២៦',
        avatar: ''
      };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(defaultProfile));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESULTS)) {
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
  },

  // Authentication & Users
  getUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
      // Sync with profile
      this.saveProfile({
        name: user.name,
        targetMinistry: user.targetMinistry || 'សាលាភូមិន្ទរដ្ឋបាល (ERA)',
        avatar: user.avatar || ''
      });
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
    return user;
  },

  // Admin Account Management (Stored & Verified in Cloudflare D1 Database)
  getAdminAccount() {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      return currentUser;
    }
    return {
      id: 'admin',
      name: 'រដ្ឋបាលប្រព័ន្ធ (Admin)',
      email: '',
      role: 'admin'
    };
  },

  async updateAdminAccount({ name, email, password, currentPassword = '' }) {
    const settings = this.getSettings();
    const workerUrl = settings.cfWorkerUrl || DEFAULT_WORKER_URL;
    const apiKey = settings.cfApiKey || '';

    const result = await CloudflareService.setupAdmin(
      { name, email, password, currentPassword },
      workerUrl,
      apiKey
    );

    if (result.success) {
      const updatedAdmin = {
        id: 'admin-d1',
        name: (name || '').trim() || 'Admin',
        email: (email || '').trim().toLowerCase(),
        role: 'admin',
        provider: 'cloudflare-d1'
      };
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.role === 'admin') {
        this.setCurrentUser(updatedAdmin);
      }
      return { success: true, user: updatedAdmin, message: result.message };
    }

    return { success: false, message: result.message || 'មិនអាចរក្សាទុកក្នុង Database បានទេ!' };
  },

  async loginWithEmail(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, message: 'សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់!' };
    }

    const settings = this.getSettings();
    const workerUrl = settings.cfWorkerUrl || DEFAULT_WORKER_URL;

    // 1. Authenticate Admin directly against Cloudflare D1 Database
    if (workerUrl) {
      try {
        const cfResult = await CloudflareService.loginAdmin(cleanEmail, cleanPassword, workerUrl);
        if (cfResult.success && cfResult.user) {
          const adminUser = {
            id: 'admin-d1',
            name: cfResult.user.name || 'រដ្ឋបាលប្រព័ន្ធ (Admin)',
            email: cfResult.user.email,
            role: 'admin',
            avatar: '',
            targetMinistry: 'គ្រប់ស្ថាប័នរដ្ឋ',
            provider: 'cloudflare-d1'
          };
          this.setCurrentUser(adminUser);
          return { success: true, user: adminUser };
        } else if (cfResult.message) {
          return { success: false, message: cfResult.message };
        }
      } catch (e) {
        console.warn('Auth check notice:', e);
      }
    }

    // 2. Check locally registered student/candidate accounts
    const users = this.getUsers();
    const user = users.find(u => u.email && u.email.toLowerCase() === cleanEmail && u.password === cleanPassword);
    if (user) {
      this.setCurrentUser(user);
      return { success: true, user };
    }

    return {
      success: false,
      message: 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!'
    };
  },

  // Dynamic Categories and Ministries from actual database entries
  getActiveCategories() {
    const exams = this.getExams();
    const questions = this.getQuestions();
    const map = new Map();

    exams.forEach(e => {
      const id = e.categoryId || 'general-knowledge';
      const name = e.categoryName || id;
      if (!map.has(id)) {
        map.set(id, { id, name });
      }
    });

    questions.forEach(q => {
      const id = q.categoryId || 'general-knowledge';
      if (!map.has(id)) {
        map.set(id, { id, name: id });
      }
    });

    return Array.from(map.values());
  },

  getActiveMinistries() {
    const exams = this.getExams();
    const map = new Map();

    exams.forEach(e => {
      const id = e.ministryId || 'general';
      const name = e.ministryName || id;
      if (id && id !== 'all' && !map.has(id)) {
        map.set(id, { id, name });
      }
    });

    return Array.from(map.values());
  },

  async loginWithGoogle(googleProfile = null) {
    if (!googleProfile || !googleProfile.email) {
      return { success: false, message: 'មិនទទួលបានព័ត៌មានពីគណនី Google ឡើយ!' };
    }

    const users = this.getUsers();
    const email = googleProfile.email.trim().toLowerCase();
    const name = googleProfile.name || email.split('@')[0] || 'បេក្ខជន Google';
    const avatar = googleProfile.picture || '';

    let user = users.find(u => u.email && u.email.toLowerCase() === email);

    if (!user) {
      user = {
        id: googleProfile.sub ? 'g-' + googleProfile.sub : 'user-g-' + Date.now(),
        name,
        email,
        password: '',
        role: 'candidate',
        avatar,
        targetMinistry: googleProfile.targetMinistry || 'សាលាភូមិន្ទរដ្ឋបាល (ERA)',
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      users.push(user);
    } else {
      user.name = name || user.name;
      user.avatar = avatar || user.avatar;
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(user);

    // Sync user directly into Cloudflare D1 Database
    const settings = this.getSettings();
    const workerUrl = settings.cfWorkerUrl || DEFAULT_WORKER_URL;
    if (workerUrl) {
      try {
        await CloudflareService.syncUser(user, workerUrl);
      } catch (e) {
        console.warn('Sync Google user to D1 notice:', e);
      }
    }

    return { success: true, user };
  },

  async registerUser({ name, email, password, targetMinistry = 'សាលាភូមិន្ទរដ្ឋបាល (ERA)' }) {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'អ៊ីមែលនេះមានគណនីក្នុងប្រព័ន្ធរួចហើយ!' };
    }

    const newUser = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'candidate',
      avatar: '',
      targetMinistry,
      provider: 'email',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);

    // Sync user directly into Cloudflare D1 Database
    const settings = this.getSettings();
    const workerUrl = settings.cfWorkerUrl || DEFAULT_WORKER_URL;
    if (workerUrl) {
      try {
        await CloudflareService.syncUser(newUser, workerUrl);
      } catch (e) {
        console.warn('Sync email user to D1 notice:', e);
      }
    }

    return { success: true, user: newUser };
  },

  logout() {
    this.setCurrentUser(null);
  },

  // Exam Papers
  getExams() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
      return data ? JSON.parse(data) : [...DEFAULT_EXAMS];
    } catch (e) {
      console.error('Failed to get exams:', e);
      return [...DEFAULT_EXAMS];
    }
  },

  saveExam(exam) {
    const exams = this.getExams();
    const index = exams.findIndex(e => e.id === exam.id);
    if (index >= 0) {
      exams[index] = { ...exams[index], ...exam, updatedAt: new Date().toISOString() };
    } else {
      exams.unshift({
        ...exam,
        id: exam.id || 'exam-' + Date.now(),
        createdAt: new Date().toISOString()
      });
    }
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    return exams;
  },

  deleteExam(id) {
    let exams = this.getExams();
    exams = exams.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    return exams;
  },

  // Mock Test Questions
  getQuestions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      return data ? JSON.parse(data) : [...DEFAULT_QUESTIONS];
    } catch (e) {
      console.error('Failed to get questions:', e);
      return [...DEFAULT_QUESTIONS];
    }
  },

  saveQuestion(question) {
    const questions = this.getQuestions();
    const index = questions.findIndex(q => q.id === question.id);
    if (index >= 0) {
      questions[index] = { ...questions[index], ...question, updatedAt: new Date().toISOString() };
    } else {
      questions.unshift({
        ...question,
        id: question.id || 'q-' + Date.now(),
        createdAt: new Date().toISOString()
      });
    }
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    return questions;
  },

  deleteQuestion(id) {
    let questions = this.getQuestions();
    questions = questions.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    return questions;
  },

  // Quiz Results & History
  getQuizResults() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESULTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveQuizResult(result) {
    const results = this.getQuizResults();
    const currentUser = this.getCurrentUser();
    const record = {
      ...result,
      id: 'res-' + Date.now(),
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'បេក្ខជន',
      date: new Date().toISOString()
    };
    results.unshift(record);
    if (results.length > 50) results.pop();
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    return record;
  },

  // Bookmarks
  getBookmarks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  toggleBookmark(itemId) {
    const bookmarks = this.getBookmarks();
    const idx = bookmarks.indexOf(itemId);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
    } else {
      bookmarks.push(itemId);
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return bookmarks.includes(itemId);
  },

  isBookmarked(itemId) {
    return this.getBookmarks().includes(itemId);
  },

  setAllExams(exams) {
    if (Array.isArray(exams) && exams.length > 0) {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    }
  },

  setAllQuestions(questions) {
    if (Array.isArray(questions) && questions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    }
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = data ? JSON.parse(data) : {};
      return {
        theme: 'light',
        fontSize: 'medium',
        sound: true,
        cfWorkerUrl: DEFAULT_WORKER_URL,
        cfApiKey: '',
        cfAutoSync: true,
        ...parsed,
        cfWorkerUrl: (parsed.cfWorkerUrl && parsed.cfWorkerUrl.trim()) ? parsed.cfWorkerUrl : DEFAULT_WORKER_URL
      };
    } catch (e) {
      return {
        theme: 'light',
        fontSize: 'medium',
        sound: true,
        cfWorkerUrl: DEFAULT_WORKER_URL,
        cfApiKey: '',
        cfAutoSync: true
      };
    }
  },

  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  async fetchRemoteFirebaseConfig() {
    const settings = this.getSettings();
    const workerUrl = settings.cfWorkerUrl || DEFAULT_WORKER_URL;
    if (!workerUrl) return null;
    try {
      const res = await CloudflareService.getFirebaseConfig(workerUrl);
      if (res.success && res.config) {
        const clientId = res.config.googleClientId || res.config.clientId || (res.config.authDomain ? res.config.authDomain.split('.')[0] : '');
        this.saveSettings({ 
          firebaseConfig: res.config, 
          googleClientId: clientId || settings.googleClientId 
        });
        return res.config;
      }
    } catch (e) {}
    return null;
  },

  // Profile
  getProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : { name: 'បេក្ខជន ត្រៀមប្រឡង' };
    } catch (e) {
      return { name: 'បេក្ខជន ត្រៀមប្រឡង' };
    }
  },

  saveProfile(profile) {
    const current = this.getProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  },

  // Backup & Restore
  exportAllData() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exams: this.getExams(),
      questions: this.getQuestions(),
      results: this.getQuizResults(),
      bookmarks: this.getBookmarks(),
      profile: this.getProfile(),
      users: this.getUsers()
    }, null, 2);
  },

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.exams && Array.isArray(data.exams)) {
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(data.exams));
      }
      if (data.questions && Array.isArray(data.questions)) {
        localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(data.questions));
      }
      if (data.profile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
      }
      if (data.users && Array.isArray(data.users)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      }
      return { success: true, countExams: data.exams?.length || 0, countQuestions: data.questions?.length || 0 };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  resetAll() {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(DEFAULT_EXAMS));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
};
