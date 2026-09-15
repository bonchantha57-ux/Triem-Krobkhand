/**
 * Client service to communicate with Cloudflare Worker & D1 Database
 */

export const CloudflareService = {
  async testConnection(workerUrl, apiKey = '') {
    if (!workerUrl || !workerUrl.trim()) {
      return { success: false, message: 'សូមបញ្ចូល Cloudflare Worker URL ជាមុនសិន!' };
    }

    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${cleanUrl}/api/health`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: true,
        message: 'ការតភ្ជាប់ជោគជ័យ! Cloudflare D1 ដំណើរការល្អ។',
        data
      };
    } catch (err) {
      return {
        success: false,
        message: 'មិនអាចតភ្ជាប់ទៅ Cloudflare Worker បានទេ៖ ' + (err.name === 'AbortError' ? 'Timeout (លើសពេលកំណត់ 8s)' : err.message)
      };
    }
  },

  async pushData(workerUrl, apiKey, { exams, questions }) {
    if (!workerUrl || !workerUrl.trim()) {
      return { success: false, message: 'សូមបញ្ចូល Cloudflare Worker URL!' };
    }
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${cleanUrl}/api/sync/push`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ exams, questions })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      return { success: true, message: result.message || 'បានបញ្ជូនទិន្នន័យទៅ Cloudflare រួចរាល់!' };
    } catch (err) {
      return { success: false, message: 'បរាជ័យក្នុងការបញ្ជូនទៅ Cloudflare៖ ' + err.message };
    }
  },

  async pullData(workerUrl, apiKey) {
    if (!workerUrl || !workerUrl.trim()) {
      return { success: false, message: 'សូមបញ្ចូល Cloudflare Worker URL!' };
    }
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${cleanUrl}/api/sync/pull`, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      return {
        success: true,
        exams: result.exams || [],
        questions: result.questions || [],
        syncedAt: result.syncedAt
      };
    } catch (err) {
      return { success: false, message: 'បរាជ័យក្នុងការទាញទិន្នន័យពី Cloudflare៖ ' + err.message };
    }
  },

  /**
   * Authenticate admin directly via Cloudflare D1 Database (Zero credentials in frontend)
   */
  async loginAdmin(email, password, workerUrl) {
    if (!workerUrl || !workerUrl.trim()) {
      return { success: false, message: 'សូមបញ្ចូល Cloudflare Worker URL ក្នុង Settings ជាមុនសិន!' };
    }
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');

    try {
      const res = await fetch(`${cleanUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404) {
          return {
            success: false,
            message: 'Cloudflare Worker មិនទាន់បាន Deploy កូដថ្មី (worker.js) ឡើយ! សូមចូល Cloudflare ចុច Edit code រួចចុច Deploy។'
          };
        }
        return {
          success: false,
          needsSetup: data.needsSetup || false,
          message: data.message || data.error || 'ការផ្ទៀងផ្ទាត់បរាជ័យ!'
        };
      }

      return data;
    } catch (err) {
      return {
        success: false,
        message: 'មិនអាចតភ្ជាប់ទៅ Server ផ្ទៀងផ្ទាត់ Admin បានទេ៖ ' + err.message
      };
    }
  },

  /**
   * Setup or Update Admin credentials directly into Cloudflare D1 system_config table
   */
  async setupAdmin({ name, email, password, currentPassword = '' }, workerUrl, apiKey = '') {
    if (!workerUrl || !workerUrl.trim()) {
      return { success: false, message: 'សូមបញ្ចូល Cloudflare Worker URL ក្នុង Settings ជាមុនសិន!' };
    }
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${cleanUrl}/api/auth/setup-admin`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, email, password, currentPassword })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          message: data.error || data.message || 'មិនអាចបង្កើត ឬកែប្រែគណនី Admin បានទេ!'
        };
      }

      return data;
    } catch (err) {
      return {
        success: false,
        message: 'បរាជ័យក្នុងការរក្សាទុកគណនី Admin ទៅ Database៖ ' + err.message
      };
    }
  },

  /**
   * Check if Cloudflare D1 has an admin account already configured
   */
  async checkAdminStatus(workerUrl) {
    if (!workerUrl || !workerUrl.trim()) return { hasAdmin: false };
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');

    try {
      const res = await fetch(`${cleanUrl}/api/auth/admin-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) return { hasAdmin: false };
      const data = await res.json().catch(() => ({ hasAdmin: false }));
      return data;
    } catch (e) {
      return { hasAdmin: false };
    }
  },

  /**
   * Sync/save registered or Google user into Cloudflare D1 users table
   */
  async syncUser(user, workerUrl) {
    if (!workerUrl || !workerUrl.trim()) {
      return { success: false, message: 'Worker URL missing' };
    }
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');

    try {
      const res = await fetch(`${cleanUrl}/api/auth/sync-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'បរាជ័យក្នុងការ Sync User');
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Fetch all registered users/candidates from Cloudflare D1 (For Admin view)
   */
  async getUsers(workerUrl, apiKey = '') {
    if (!workerUrl || !workerUrl.trim()) {
      return { success: false, users: [], totalCount: 0, googleCount: 0, emailCount: 0 };
    }
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${cleanUrl}/api/users`, {
        method: 'GET',
        headers
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'មិនអាចទាញទិន្នន័យ Users បានទេ');
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message, users: [], totalCount: 0, googleCount: 0, emailCount: 0 };
    }
  },

  /**
   * Delete a user from Cloudflare D1 (Admin only)
   */
  async deleteUser(userId, workerUrl, apiKey = '') {
    if (!workerUrl || !workerUrl.trim()) return { success: false };
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${cleanUrl}/api/users/${userId}`, {
        method: 'DELETE',
        headers
      });
      return await res.json().catch(() => ({ success: false }));
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  /**
   * Fetch Firebase / Google Auth configuration from Cloudflare D1
   */
  async getFirebaseConfig(workerUrl) {
    if (!workerUrl || !workerUrl.trim()) return { success: false, config: null };
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');
    try {
      const res = await fetch(`${cleanUrl}/api/auth/firebase-config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) return { success: false, config: null };
      return await res.json().catch(() => ({ success: false, config: null }));
    } catch (e) {
      return { success: false, config: null };
    }
  },

  /**
   * Save Firebase / Google Auth configuration into Cloudflare D1 (Admin only)
   */
  async saveFirebaseConfig(config, workerUrl, apiKey = '') {
    if (!workerUrl || !workerUrl.trim()) {
      return { success: false, message: 'Cloudflare Worker URL មិនទាន់បានកំណត់ទេ!' };
    }
    const cleanUrl = workerUrl.trim().replace(/\/+$/, '');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${cleanUrl}/api/auth/save-firebase-config`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ config })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'បរាជ័យក្នុងការរក្សាទុក Firebase Config');
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
};
