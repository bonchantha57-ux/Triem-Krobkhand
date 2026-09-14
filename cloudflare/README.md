# របៀបភ្ជាប់ និងដាក់ឱ្យដំណើរការ Cloudflare Database (D1 & Worker) សម្រាប់ Triem Krobkhand

ឯកសារនេះណែនាំពីរបៀបបង្កើត និងដាក់ឱ្យដំណើរការ (Deploy) Cloudflare Worker និង Cloudflare D1 Database ឥតគិតថ្លៃ (Free Tier)។

---

## ជំហានទី ១៖ បង្កើត Cloudflare D1 Database
បើក Terminal នៅក្នុង Folder `cloudflare/` រួចវាយបញ្ជា៖
```bash
# 1. ចូល Cloudflare Account (ប្រសិនបើមិនទាន់បាន Login)
npx wrangler login

# 2. បង្កើត Database ឈ្មោះ triem-krobkhand-db
npx wrangler d1 create triem-krobkhand-db
```
បន្ទាប់មក Cloudflare នឹងបង្ហាញ `database_id`។ សូមចម្លង `database_id` នោះទៅដាក់ជំនួសក្នុង `cloudflare/wrangler.toml`៖
```toml
[[d1_databases]]
binding = "DB"
database_name = "triem-krobkhand-db"
database_id = "ដាក់_DATABASE_ID_របស់អ្នកនៅទីនេះ"
```

---

## ជំហានទី ២៖ បង្កើតតារាងទិន្នន័យ (Run Schema Migration)
អនុវត្តបញ្ជាខាងក្រោមដើម្បីបង្កើតតារាង `exams`, `questions`, `quiz_results`:
```bash
npx wrangler d1 execute triem-krobkhand-db --remote --file=./schema.sql
```

---

## ជំហានទី ៣៖ Deploy Worker ទៅលើ Cloudflare
```bash
npx wrangler deploy
```
ពេល Deploy ចប់ អ្នកនឹងទទួលបាន URL មួយ ឧទាហរណ៍៖
`https://triem-krobkhand-api.your-subdomain.workers.dev`

---

## ជំហានទី ៤៖ ភ្ជាប់ URL ទៅក្នុង Triem Krobkhand WebApp
1. បើក WebApp Triem Krobkhand
2. ចូលទៅកាន់ **Setting (ការកំណត់)**
3. បញ្ចូល Worker URL របស់អ្នក (ឧ. `https://triem-krobkhand-api.your-subdomain.workers.dev`)
4. ចុចប៊ូតុង **"សាកល្បងការតភ្ជាប់ (Test Connection)"**
5. ចុចប៊ូតុង **"ធ្វើសមកាលកម្មទិន្នន័យ (Sync Data)"**

---

## ជំហានទី ៥៖ បញ្ចូលគណនី Admin ក្នុង Database D1 (សុវត្ថិភាពខ្ពស់ គ្មានដាក់លើ Code)
ដើម្បីកុំឱ្យគេលួចបាននៅពេល Hosting លើ GitHub ពាក្យសម្ងាត់ Admin មិនត្រូវបានដាក់លើ Code ឡើយ។
អ្នកអាចជ្រើសរើសជម្រើសមួយក្នុងចំណោមពីរខាងក្រោម៖

### ជម្រើស A (ងាយស្រួលបំផុត)៖ បង្កើតតាមរយៈ WebApp
1. បើក WebApp រួចចុចប៊ូតុង **Login** នៅជ្រុងខាងស្តាំខាងលើ
2. ចុចលើពាក្យ **"បង្កើតគណនី Admin ដំបូង"**
3. បំពេញឈ្មោះ, Email និង Password ផ្ទាល់ខ្លួនរបស់អ្នក រួចចុច **"រក្សាទុកគណនី Admin ក្នុង Database"**

### ជម្រើស B៖ បញ្ចូលផ្ទាល់តាម Cloudflare D1 Console (SQL Query)
1. ចូលទៅកាន់ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. ចូលទៅកាន់ **Workers & Pages** > **D1 SQL Database** > **triem-krobkhand-db** > ចុចលើផ្ទាំង **Console**
3. ចម្លងកូដ SQL ខាងក្រោមនេះ (ប្តូរ Email និង Password របស់អ្នក) រួច Paste ចូលប្រអប់ Console ហើយចុច **Execute**៖

```sql
INSERT INTO system_config (key, value)
VALUES ('admin_account', '{"name":"Admin","email":"YOUR_EMAIL@gmail.com","password":"YOUR_PASSWORD"}')
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;
```

បន្ទាប់ពី Execute រួច គណនី Admin របស់អ្នកនឹងត្រូវបានការពារ និងផ្ទៀងផ្ទាត់ដោយផ្ទាល់ពី Cloudflare D1 Database។

