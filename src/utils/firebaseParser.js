/**
 * Parser utility to extract Firebase configuration from raw text, JavaScript code snippets, or JSON
 */
export function parseFirebaseConfigInput(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim();
  if (!text) return null;

  // 1. Try pure JSON parsing
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object') {
      if (obj.apiKey || obj.projectId || obj.authDomain) {
        return {
          apiKey: obj.apiKey || '',
          authDomain: obj.authDomain || (obj.projectId ? `${obj.projectId}.firebaseapp.com` : ''),
          projectId: obj.projectId || '',
          storageBucket: obj.storageBucket || '',
          messagingSenderId: obj.messagingSenderId || '',
          appId: obj.appId || '',
          measurementId: obj.measurementId || '',
          googleClientId: obj.googleClientId || obj.clientId || ''
        };
      }
      if (obj.googleClientId || obj.clientId) {
        return { googleClientId: obj.googleClientId || obj.clientId };
      }
    }
  } catch (e) {
    // Not valid JSON, continue to regex extraction
  }

  // 2. Extract key: "value" pairs from JS object code (e.g. const firebaseConfig = { ... };)
  const extractField = (key) => {
    // Matches: key: "value" or 'key': 'value' or "key": "value" or key: 'value'
    const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const apiKey = extractField('apiKey');
  const authDomain = extractField('authDomain');
  const projectId = extractField('projectId');
  const storageBucket = extractField('storageBucket');
  const messagingSenderId = extractField('messagingSenderId');
  const appId = extractField('appId');
  const measurementId = extractField('measurementId');
  const googleClientId = extractField('googleClientId') || extractField('clientId');

  if (apiKey || projectId) {
    return {
      apiKey: apiKey || '',
      authDomain: authDomain || (projectId ? `${projectId}.firebaseapp.com` : ''),
      projectId: projectId || '',
      storageBucket: storageBucket || '',
      messagingSenderId: messagingSenderId || '',
      appId: appId || '',
      measurementId: measurementId || '',
      googleClientId: googleClientId || ''
    };
  }

  // 3. Raw API key starting with AIzaSy
  if (text.startsWith('AIzaSy')) {
    return { apiKey: text };
  }

  // 4. Raw Google Client ID ending with apps.googleusercontent.com
  if (text.includes('apps.googleusercontent.com')) {
    return { googleClientId: text };
  }

  return null;
}
