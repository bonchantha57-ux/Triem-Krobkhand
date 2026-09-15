/**
 * Anti-Inspect & Client-Side Code Protection System
 * Prevents unauthorized DevTools inspection, shortcut tampering, right-click, and scraping.
 * Protected by BORN CHANTHA • Triem Krobkhand
 */

export function initAntiInspect() {
  // 1. Completely Disable Right-Click Context Menu
  const blockContextMenu = (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return false;
    }
  };

  document.addEventListener('contextmenu', blockContextMenu, { capture: true });
  window.addEventListener('contextmenu', blockContextMenu, { capture: true });

  // 2. Disable Middle Click & Right Mouse Down
  document.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, { capture: true });

  // 3. Block All Inspection & DevTools Keyboard Shortcuts
  const blockKeys = (e) => {
    const key = (e.key || '').toLowerCase();
    const keyCode = e.keyCode || e.which;
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    // F12 (DevTools)
    if (key === 'f12' || keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + Shift + [I, J, C, K, E, S, P, M]
    // I: Inspect, J: Console, C: Inspect Element, K: Firefox Web Console,
    // E: Network, S: Debugger, P: DevTools Command Palette, M: Device Mode
    if (isCtrlOrCmd && isShift && ['i', 'j', 'c', 'k', 'e', 's', 'p', 'm'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Mac DevTools: Cmd + Option + [I, J, C, U, K]
    if (isCtrlOrCmd && isAlt && ['i', 'j', 'c', 'u', 'k'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + U (View Page Source)
    if (isCtrlOrCmd && key === 'u') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + S (Save Webpage)
    if (isCtrlOrCmd && key === 's') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + P (Native Print - use in-app print button instead)
    if (isCtrlOrCmd && key === 'p') {
      const isExamDetail = document.querySelector('.exam-detail-content');
      if (!isExamDetail) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Ctrl + A outside form inputs (prevent select all / scraping)
    if (isCtrlOrCmd && key === 'a') {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  };

  window.addEventListener('keydown', blockKeys, { capture: true });
  window.addEventListener('keyup', blockKeys, { capture: true });
  document.addEventListener('keydown', blockKeys, { capture: true });

  // 4. Disable Dragging & Text Selection
  document.addEventListener('dragstart', (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      return false;
    }
  }, { capture: true });

  document.addEventListener('selectstart', (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
      e.preventDefault();
      return false;
    }
  }, { capture: true });

  // 5. Prevent Copying Outside Input Fields (Scraping Protection)
  document.addEventListener('copy', (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
      const selection = window.getSelection ? window.getSelection().toString() : '';
      if (selection.length > 30) {
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', 'រក្សាសិទ្ធិដោយ BORN CHANTHA • ត្រៀមក្របខ័ណ្ឌ (Triem Krobkhand)');
        }
      }
    }
  });

  // 6. Console Protection Warning & Neutralization
  try {
    const bannerStyle = 'font-size: 26px; font-weight: 900; color: #dc2626; background: #fee2e2; padding: 10px 18px; border-radius: 8px; border: 2px solid #dc2626;';
    const textStyle = 'font-size: 14px; font-weight: 600; color: #1e3a8a; line-height: 1.6; margin-top: 6px;';
    console.log('%cឈប់! ផ្ទាំង Inspect ត្រូវបានចាក់សោការពារ', bannerStyle);
    console.log('%cប្រព័ន្ធត្រូវបានការពាររក្សាសិទ្ធិដោយ Developer: BORN CHANTHA។\nរាល់ការបើក Developer Tools ត្រូវបានតាមដាន និងបិទមិនឱ្យដំណើរការឡើយ។', textStyle);
  } catch {}

  // 7. Multi-Engine DevTools Detection
  let isDevToolsOpen = false;

  const triggerDevToolsLock = () => {
    if (!isDevToolsOpen) {
      isDevToolsOpen = true;
      showDevToolsBlocker();
    }
  };

  const releaseDevToolsLock = () => {
    if (isDevToolsOpen) {
      isDevToolsOpen = false;
      removeDevToolsBlocker();
    }
  };

  // Detector A: Window Dimension Differential (Docked DevTools)
  const threshold = 160;
  const checkDimensions = () => {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
      triggerDevToolsLock();
    } else if (!timingTrapTriggered && !getterTrapTriggered) {
      releaseDevToolsLock();
    }
  };

  window.addEventListener('resize', checkDimensions);
  setInterval(checkDimensions, 1000);

  // Detector B: Timing Latency Debugger Trap
  let timingTrapTriggered = false;
  const checkDebuggerTiming = () => {
    const start = performance.now();
    // Debugger executes and pauses execution if DevTools is open
    // eslint-disable-next-line no-debugger
    (function() {}).constructor('debugger')();
    const duration = performance.now() - start;

    if (duration > 100) {
      timingTrapTriggered = true;
      triggerDevToolsLock();
    } else {
      timingTrapTriggered = false;
      checkDimensions();
    }
  };

  setInterval(checkDebuggerTiming, 1200);

  // Detector C: Undocked DevTools Console Element Getter Trap
  let getterTrapTriggered = false;
  const devtoolsDetector = new Image();
  Object.defineProperty(devtoolsDetector, 'id', {
    get: function() {
      getterTrapTriggered = true;
      triggerDevToolsLock();
      return 'devtools-lock';
    }
  });

  setInterval(() => {
    try {
      console.log(devtoolsDetector);
      console.clear();
    } catch {}
  }, 1500);

  // Detector D: Active Freeze Trap when DevTools is opened
  setInterval(() => {
    if (isDevToolsOpen) {
      try {
        console.clear();
        (function() {}).constructor('debugger')();
      } catch {}
    }
  }, 250);
}

/**
 * Display full screen lock overlay when DevTools is opened
 */
function showDevToolsBlocker() {
  let blocker = document.getElementById('security-devtools-blocker');
  const appLayout = document.getElementById('app');
  if (appLayout) {
    appLayout.style.filter = 'blur(20px)';
    appLayout.style.pointerEvents = 'none';
  }

  if (!blocker) {
    blocker = document.createElement('div');
    blocker.id = 'security-devtools-blocker';
    blocker.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 15, 30, 0.98);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 99999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      text-align: center;
      padding: 2rem 1.5rem;
      font-family: 'Kantumruy Pro', sans-serif;
    `;
    blocker.innerHTML = `
      <div style="width: 80px; height: 80px; border-radius: 50%; background: #dc2626; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; box-shadow: 0 0 35px rgba(220, 38, 38, 0.7); animation: pulse 2s infinite;">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h2 style="font-size: 1.65rem; font-weight: 800; color: #ffffff; margin-bottom: 0.75rem; letter-spacing: -0.02em;">
        ប្រព័ន្ធត្រូវបានការពារសុវត្ថិភាពដាច់ខាត!
      </h2>
      <p style="font-size: 1rem; color: #cbd5e1; max-width: 520px; line-height: 1.7; margin-bottom: 1.75rem;">
        មុខងារ Inspect / Developer Tools ត្រូវបានចាក់សោការពារដោយ Developer <strong>BORN CHANTHA</strong>។ មិនអនុញ្ញាតឱ្យបើកមើលកូដ ឬទាញយកទិន្នន័យឯកសារឡើយ។
      </p>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: center;">
        <button onclick="window.location.reload()" style="background: #2563eb; color: #ffffff; border: none; padding: 0.75rem 2rem; border-radius: 9999px; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); transition: all 0.2s ease;">
          ផ្ទុកទំព័រឡើងវិញ (Reload Page)
        </button>
        <span style="font-size: 0.82rem; color: #94a3b8; margin-top: 0.5rem;">
          សូមបិទផ្ទាំង Inspect ជាមុនសិន • Protected by BORN CHANTHA
        </span>
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
  const appLayout = document.getElementById('app');
  if (appLayout) {
    appLayout.style.filter = 'none';
    appLayout.style.pointerEvents = 'auto';
  }
}

