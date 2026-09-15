/**
 * Cloudflare Worker API for Triem Krobkhand (ត្រៀមក្របខ័ណ្ឌ)
 * Handles REST endpoints for Exams, Questions, and Cloud Sync via Cloudflare D1
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Content-Type': 'application/json; charset=utf-8'
    };

    // Handle OPTIONS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper: JSON response
    const json = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders
      });
    };

    // Helper: Auth Check (Optional API Key verification)
    const authHeader = request.headers.get('Authorization') || request.headers.get('X-API-Key');
    const isAuthorized = !env.API_SECRET || authHeader === `Bearer ${env.API_SECRET}` || authHeader === env.API_SECRET;

    try {
      // 1. Health Check
      if (path === '/api/health' || path === '/') {
        return json({
          status: 'online',
          app: 'Triem Krobkhand API',
          version: '1.0.0',
          database: env.DB ? 'Cloudflare D1 Connected' : 'No DB bound (Mock Mode)',
          time: new Date().toISOString()
        });
      }

      // Check DB binding
      const db = env.DB;
      if (!db) {
        return json({
          error: 'Cloudflare D1 Database binding "DB" is missing in wrangler.toml.',
          tip: 'Please configure [[d1_databases]] binding in wrangler.toml'
        }, 500);
      }

      // ==========================================
      // AUTHENTICATION (Cloudflare D1 Database)
      // ==========================================
      if (path === '/api/auth/login' && method === 'POST') {
        const { email = '', password = '' } = await request.json();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        let adminConfig = null;
        try {
          const row = await db.prepare("SELECT value FROM system_config WHERE key = 'admin_account'").first();
          if (row && row.value) {
            adminConfig = JSON.parse(row.value);
          }
        } catch (e) {}

        if (!adminConfig) {
          return json({
            success: false,
            needsSetup: true,
            message: 'មិនទាន់មានគណនី Admin ក្នុង Database នៅឡើយទេ សូមបង្កើតគណនី Admin ថ្មីជាមុនសិន!'
          });
        }

        if (adminConfig.email.toLowerCase() === cleanEmail && adminConfig.password === cleanPassword) {
          return json({
            success: true,
            user: {
              role: 'admin',
              name: adminConfig.name || 'រដ្ឋបាលប្រព័ន្ធ (Admin)',
              email: adminConfig.email
            }
          });
        }

        return json({ success: false, message: 'Email ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!' }, 401);
      }

      if (path === '/api/auth/setup-admin' && method === 'POST') {
        const { name = 'Admin', email = '', password = '', currentPassword = '' } = await request.json();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanPassword) {
          return json({ error: 'សូមបំពេញ Email និង Password ឱ្យបានត្រឹមត្រូវ!' }, 400);
        }

        // Check if admin already exists
        const existing = await db.prepare("SELECT value FROM system_config WHERE key = 'admin_account'").first();
        if (existing && existing.value) {
          let existingData = null;
          try { existingData = JSON.parse(existing.value); } catch (e) {}
          const currentMatches = existingData && existingData.password && (currentPassword.trim() === existingData.password);
          if (!isAuthorized && !currentMatches) {
            return json({ error: 'គណនី Admin មានរួចហើយក្នុង Database! សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន (Current Password) ដើម្បីផ្លាស់ប្តូរ។' }, 403);
          }
        }

        const adminData = {
          name: name.trim() || 'Admin',
          email: cleanEmail,
          password: cleanPassword,
          updatedAt: new Date().toISOString()
        };

        await db.prepare(`
          INSERT INTO system_config (key, value)
          VALUES ('admin_account', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `).bind(JSON.stringify(adminData)).run();

        return json({
          success: true,
          message: 'គណនី Admin ត្រូវបានរក្សាទុកក្នុង Database D1 ដោយជោគជ័យ!',
          user: {
            role: 'admin',
            name: adminData.name,
            email: adminData.email
          }
        });
      }

      if (path === '/api/auth/admin-status') {
        let hasAdmin = false;
        try {
          const row = await db.prepare("SELECT value FROM system_config WHERE key = 'admin_account'").first();
          hasAdmin = !!(row && row.value);
        } catch (e) {}
        return json({ hasAdmin });
      }

      // 2. EXAMS ENDPOINTS (/api/exams)
      if (path === '/api/exams') {
        if (method === 'GET') {
          const ministry = url.searchParams.get('ministry');
          const category = url.searchParams.get('category');
          let query = 'SELECT * FROM exams ORDER BY created_at DESC';
          let params = [];

          if (ministry && ministry !== 'all') {
            query = 'SELECT * FROM exams WHERE ministry_id = ? ORDER BY created_at DESC';
            params = [ministry];
          } else if (category && category !== 'all') {
            query = 'SELECT * FROM exams WHERE category_id = ? ORDER BY created_at DESC';
            params = [category];
          }

          const stmt = db.prepare(query);
          const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

          // Transform tags JSON string if necessary
          const formatted = results.map(r => ({
            ...r,
            ministryId: r.ministry_id,
            ministryName: r.ministry_name,
            categoryId: r.category_id,
            categoryName: r.category_name,
            durationMinutes: r.duration_minutes,
            totalQuestions: r.total_questions,
            imageUrl: r.image_url,
            tags: r.tags ? (r.tags.startsWith('[') ? JSON.parse(r.tags) : r.tags.split(',')) : []
          }));

          return json({ success: true, count: formatted.length, exams: formatted });
        }

        if (method === 'POST') {
          if (!isAuthorized) return json({ error: 'Unauthorized: Invalid API Key' }, 401);
          const body = await request.json();
          const id = body.id || 'exam-' + Date.now();
          const tagsStr = Array.isArray(body.tags) ? JSON.stringify(body.tags) : (body.tags || '');

          await db.prepare(`
            INSERT INTO exams (id, title, ministry_id, ministry_name, category_id, category_name, year, duration_minutes, difficulty, total_questions, description, content, image_url, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            body.title || 'វិញ្ញាសាថ្មី',
            body.ministryId || 'all',
            body.ministryName || 'គ្រប់ស្ថាប័ន',
            body.categoryId || 'general-knowledge',
            body.categoryName || 'វប្បធម៌ទូទៅ',
            body.year || '2024',
            body.durationMinutes || 60,
            body.difficulty || 'មធ្យម',
            body.totalQuestions || 30,
            body.description || '',
            body.content || '',
            body.imageUrl || '',
            tagsStr
          ).run();

          return json({ success: true, message: 'វិញ្ញាសាត្រូវបានរក្សាទុកដោយជោគជ័យ', id });
        }
      }

      // Exam by ID
      if (path.startsWith('/api/exams/')) {
        const id = path.replace('/api/exams/', '');
        if (method === 'DELETE') {
          if (!isAuthorized) return json({ error: 'Unauthorized' }, 401);
          await db.prepare('DELETE FROM exams WHERE id = ?').bind(id).run();
          return json({ success: true, message: 'វិញ្ញាសាត្រូវបានលុប' });
        }
      }

      // 3. QUESTIONS ENDPOINTS (/api/questions)
      if (path === '/api/questions') {
        if (method === 'GET') {
          const category = url.searchParams.get('category');
          let query = 'SELECT * FROM questions ORDER BY created_at DESC';
          let params = [];

          if (category && category !== 'all') {
            query = 'SELECT * FROM questions WHERE category_id = ? ORDER BY created_at DESC';
            params = [category];
          }

          const { results } = params.length > 0 ? await db.prepare(query).bind(...params).all() : await db.prepare(query).all();

          const formatted = results.map(q => ({
            id: q.id,
            categoryId: q.category_id,
            ministryId: q.ministry_id,
            question: q.question,
            imageUrl: q.image_url,
            options: q.options ? JSON.parse(q.options) : [],
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty
          }));

          return json({ success: true, count: formatted.length, questions: formatted });
        }

        if (method === 'POST') {
          if (!isAuthorized) return json({ error: 'Unauthorized' }, 401);
          const body = await request.json();
          const id = body.id || 'q-' + Date.now();
          const optionsJson = JSON.stringify(body.options || []);

          await db.prepare(`
            INSERT INTO questions (id, category_id, ministry_id, question, image_url, options, correct_answer, explanation, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            body.categoryId || 'general-knowledge',
            body.ministryId || 'all',
            body.question || '',
            body.imageUrl || '',
            optionsJson,
            body.correctAnswer !== undefined ? body.correctAnswer : 0,
            body.explanation || '',
            body.difficulty || 'មធ្យម'
          ).run();

          return json({ success: true, message: 'សំណួរត្រូវបានបញ្ចូលដោយជោគជ័យ', id });
        }
      }

      // Question by ID
      if (path.startsWith('/api/questions/')) {
        const id = path.replace('/api/questions/', '');
        if (method === 'DELETE') {
          if (!isAuthorized) return json({ error: 'Unauthorized' }, 401);
          await db.prepare('DELETE FROM questions WHERE id = ?').bind(id).run();
          return json({ success: true, message: 'សំណួរត្រូវបានលុប' });
        }
      }

      // 4. BATCH SYNC ENDPOINTS (/api/sync/push and /api/sync/pull)
      if (path === '/api/sync/pull') {
        const examsRes = await db.prepare('SELECT * FROM exams').all();
        const questionsRes = await db.prepare('SELECT * FROM questions').all();

        const exams = examsRes.results.map(r => ({
          ...r,
          ministryId: r.ministry_id,
          ministryName: r.ministry_name,
          categoryId: r.category_id,
          categoryName: r.category_name,
          durationMinutes: r.duration_minutes,
          totalQuestions: r.total_questions,
          imageUrl: r.image_url,
          tags: r.tags ? (r.tags.startsWith('[') ? JSON.parse(r.tags) : r.tags.split(',')) : []
        }));

        const questions = questionsRes.results.map(q => ({
          id: q.id,
          categoryId: q.category_id,
          ministryId: q.ministry_id,
          question: q.question,
          imageUrl: q.image_url,
          options: q.options ? JSON.parse(q.options) : [],
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty
        }));

        return json({
          success: true,
          syncedAt: new Date().toISOString(),
          exams,
          questions
        });
      }

      if (path === '/api/sync/push' && method === 'POST') {
        if (!isAuthorized) return json({ error: 'Unauthorized' }, 401);
        const { exams = [], questions = [] } = await request.json();

        // Batch upsert exams
        for (const exam of exams) {
          const tagsStr = Array.isArray(exam.tags) ? JSON.stringify(exam.tags) : (exam.tags || '');
          await db.prepare(`
            INSERT OR REPLACE INTO exams (id, title, ministry_id, ministry_name, category_id, category_name, year, duration_minutes, difficulty, total_questions, description, content, image_url, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            exam.id,
            exam.title,
            exam.ministryId || 'all',
            exam.ministryName || 'គ្រប់ស្ថាប័ន',
            exam.categoryId || 'general-knowledge',
            exam.categoryName || 'វប្បធម៌ទូទៅ',
            exam.year || '2024',
            exam.durationMinutes || 60,
            exam.difficulty || 'មធ្យម',
            exam.totalQuestions || 30,
            exam.description || '',
            exam.content || '',
            exam.imageUrl || '',
            tagsStr
          ).run();
        }

        // Batch upsert questions
        for (const q of questions) {
          const optionsJson = JSON.stringify(q.options || []);
          await db.prepare(`
            INSERT OR REPLACE INTO questions (id, category_id, ministry_id, question, image_url, options, correct_answer, explanation, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            q.id,
            q.categoryId || 'general-knowledge',
            q.ministryId || 'all',
            q.question,
            q.imageUrl || '',
            optionsJson,
            q.correctAnswer ?? 0,
            q.explanation || '',
            q.difficulty || 'មធ្យម'
          ).run();
        }

        return json({
          success: true,
          message: `បានធ្វើសមកាលកម្ម (Sync) វិញ្ញាសាចំនួន ${exams.length} និង សំណួរចំនួន ${questions.length} ទៅ Cloudflare D1 រួចរាល់!`
        });
      }

      // 5. FIREBASE & GOOGLE CONFIGURATION ENDPOINTS (/api/auth/firebase-config)
      if (path === '/api/auth/firebase-config' && method === 'GET') {
        let config = null;
        try {
          const row = await db.prepare("SELECT value FROM system_config WHERE key = 'firebase_config'").first();
          if (row && row.value) {
            config = JSON.parse(row.value);
          }
        } catch (e) {}

        // Fallback to environment variables if set in Cloudflare Worker
        if (!config && (env.FIREBASE_CONFIG || env.GOOGLE_CLIENT_ID)) {
          config = env.FIREBASE_CONFIG ? (typeof env.FIREBASE_CONFIG === 'string' ? JSON.parse(env.FIREBASE_CONFIG) : env.FIREBASE_CONFIG) : {};
          if (env.GOOGLE_CLIENT_ID) config.googleClientId = env.GOOGLE_CLIENT_ID;
        }

        return json({
          success: true,
          configured: !!(config && (config.apiKey || config.googleClientId || config.clientId)),
          config: config || null
        });
      }

      if (path === '/api/auth/save-firebase-config' && method === 'POST') {
        const body = await request.json();
        const config = body.config || body;

        // Auto create system_config table if not exists
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        await db.prepare(`
          INSERT INTO system_config (key, value)
          VALUES ('firebase_config', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `).bind(typeof config === 'string' ? config : JSON.stringify(config)).run();

        return json({
          success: true,
          message: 'បានរក្សាទុកការកំណត់ Firebase & Google Auth ក្នុង Cloudflare D1 រួចរាល់!'
        });
      }

      // 6. USER ACCOUNTS & GOOGLE SYNC ENDPOINTS (/api/users and /api/auth/sync-user)
      if (path === '/api/auth/sync-user' && method === 'POST') {
        const body = await request.json();
        const {
          id = 'user-' + Date.now(),
          name = 'បេក្ខជន',
          email = '',
          avatar = '',
          provider = 'google',
          targetMinistry = 'សាលាភូមិន្ទរដ្ឋបាល (ERA)',
          role = 'candidate'
        } = body;

        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail) {
          return json({ error: 'Email មិនអាចទទេបានទេ!' }, 400);
        }

        // Auto create users table if not exists
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            avatar TEXT,
            provider TEXT DEFAULT 'google',
            target_ministry TEXT DEFAULT 'សាលាភូមិន្ទរដ្ឋបាល (ERA)',
            role TEXT DEFAULT 'candidate',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        // Upsert user into D1
        await db.prepare(`
          INSERT INTO users (id, name, email, avatar, provider, target_ministry, role, last_login_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            avatar = CASE WHEN excluded.avatar != '' THEN excluded.avatar ELSE users.avatar END,
            target_ministry = excluded.target_ministry,
            last_login_at = CURRENT_TIMESTAMP
        `).bind(id, name.trim(), cleanEmail, avatar, provider, targetMinistry, role).run();

        const savedUser = await db.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();

        return json({
          success: true,
          message: 'បានរក្សាទុកព័ត៌មានអ្នកប្រើប្រាស់ក្នុង Database D1 ជោគជ័យ!',
          user: {
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            avatar: savedUser.avatar,
            provider: savedUser.provider,
            targetMinistry: savedUser.target_ministry,
            role: savedUser.role,
            createdAt: savedUser.created_at
          }
        });
      }

      if (path === '/api/users' && method === 'GET') {
        // Auto create users table if not exists
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            avatar TEXT,
            provider TEXT DEFAULT 'google',
            target_ministry TEXT DEFAULT 'សាលាភូមិន្ទរដ្ឋបាល (ERA)',
            role TEXT DEFAULT 'candidate',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        const usersRes = await db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
        const usersList = (usersRes.results || []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          provider: u.provider,
          targetMinistry: u.target_ministry,
          role: u.role,
          createdAt: u.created_at,
          lastLoginAt: u.last_login_at
        }));

        const googleCount = usersList.filter(u => u.provider === 'google').length;
        const emailCount = usersList.filter(u => u.provider !== 'google').length;

        return json({
          success: true,
          totalCount: usersList.length,
          googleCount,
          emailCount,
          users: usersList
        });
      }

      if (path.startsWith('/api/users/') && method === 'DELETE') {
        if (!isAuthorized) return json({ error: 'Unauthorized' }, 401);
        const userId = path.replace('/api/users/', '');
        await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
        return json({ success: true, message: 'បានលុបអ្នកប្រើប្រាស់រួចរាល់' });
      }

      return json({ error: 'Endpoint not found: ' + path }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};
