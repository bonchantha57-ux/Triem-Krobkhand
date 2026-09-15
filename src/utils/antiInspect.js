/**
 * Anti-Inspect & Client-Side Code Protection System
 * Prevents unauthorized DevTools inspection, shortcut tampering, and right-click access.
 * Protected by BORN CHANTHA • Triem Krobkhand
 */

export function initAntiInspect() {
  // 1. Disable Right-Click Context Menu
  document.addEventListener('contextmenu', (e) => {
    // Allow right click only on text input fields if needed, otherwise block completely
    const tag = e.target.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 2. Block DevTools Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // F12 (123)
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // Ctrl + Shift + I (Inspect)
    // Ctrl + Shift + J (Console)
    // Ctrl + Shift + C (Element Inspector)
    // Ctrl + Shift + K (Firefox Console)
    if (isCtrlOrCmd && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + U (View Source)
    if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + S (Save Webpage)
    if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 3. Prevent dragging images & elements
  window.addEventListener('dragstart', (e) => {
    if (e.target.tagName?.toLowerCase() === 'img') {
      e.preventDefault();
    }
  });

  // 4. Console Security Warning
  try {
    const warningTitle = 'font-size: 28px; font-weight: bold; color: #dc2626; -webkit-text-stroke: 1px black;';
    const warningText = 'font-size: 14px; font-weight: 600; color: #1e3a8a; line-height: 1.6;';
    console.log('%cឈប់! (STOP)', warningTitle);
    console.log('%cផ្ទាំង Inspect / Developer Tools ត្រូវបានចាក់សោការពាររក្សាសិទ្ធិដោយ Developer: BORN CHANTHA។\nរាល់ទិន្នន័យ និងវិញ្ញាសាត្រូវបានការពារសុវត្ថិភាព។', warningText);
  } catch {}

  // 5. Anti-Debugging Protection
  // When DevTools is opened, this loop halts execution inside the debugger
  let isDevToolsOpen = false;

  const checkDevTools = () => {
    const start = performance.now();
    // Debugger breakpoint triggers if DevTools is open
    // eslint-disable-next-line no-debugger
    debugger;
    const end = performance.now();

    if (end - start > 100) {
      if (!isDevToolsOpen) {
        isDevToolsOpen = true;
        showDevToolsBlocker();
      }
    } else {
      if (isDevToolsOpen) {
        isDevToolsOpen = false;
        removeDevToolsBlocker();
      }
    }
  };

  // Run anti-debug check periodically
  setInterval(checkDevTools, 1000);

  // 6. Window Dimension Check (for docked DevTools)
  const threshold = 160;
  window.addEventListener('resize', () => {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
      if (!isDevToolsOpen) {
        isDevToolsOpen = true;
        showDevToolsBlocker();
      }
    } else {
      if (isDevToolsOpen) {
        isDevToolsOpen = false;
        removeDevToolsBlocker();
      }
    }
  });
}

/**
 * Display full screen lock overlay when DevTools is opened
 */
function showDevToolsBlocker() {
  let blocker = document.getElementById('security-devtools-blocker');
  if (!blocker) {
    blocker = document.createElement('div');
    blocker.id = 'security-devtools-blocker';
    blocker.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.98);
      backdrop-filter: blur(12px);
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      text-align: center;
      padding: 1.5rem;
      font-family: 'Kantumruy Pro', sans-serif;
    `;
    blocker.innerHTML = `
      <div style="width: 72px; height: 72px; border-radius: 50%; background: #dc2626; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; box-shadow: 0 0 25px rgba(220, 38, 38, 0.6);">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">
        ប្រព័ន្ធត្រូវបានការពារសុវត្ថិភាព!
      </h2>
      <p style="font-size: 0.95rem; color: #cbd5e1; max-width: 460px; line-height: 1.6; margin-bottom: 1.5rem;">
        មុខងារ Inspect / Developer Tools ត្រូវបានបិទមិនឱ្យប្រើប្រាស់ឡើយ ដើម្បីការពារសុវត្ថិភាពទិន្នន័យ និងឯកសារវិញ្ញាសា។
      </p>
      <div style="font-size: 0.82rem; color: #94a3b8; background: rgba(255, 255, 255, 0.08); padding: 0.5rem 1.2rem; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.15);">
        សូមបិទផ្ទាំង Inspect ដើម្បីបន្តប្រើប្រាស់កម្មវិធី • Developed by BORN CHANTHA
      </div>
    `;
    document.body.appendChild(blocker);
  }
  blocker.style.display = 'flex';
}

function removeDevToolsBlocker() {
  const blocker = document.getElementById('security-devtools-blocker');
  if (blocker) {
    blocker.style.display = 'none';
  }
}
