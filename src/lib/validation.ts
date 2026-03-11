const FORBIDDEN_PATTERNS = [
  { pattern: /\bdocument\b/, label: 'document' },
  { pattern: /\bwindow\b/, label: 'window' },
  { pattern: /\bfetch\b/, label: 'fetch' },
  { pattern: /\bXMLHttpRequest\b/, label: 'XMLHttpRequest' },
  { pattern: /\bWebSocket\b/, label: 'WebSocket' },
  { pattern: /\beval\s*\(/, label: 'eval()' },
  { pattern: /new\s+Function\s*\(/, label: 'new Function()' },
  { pattern: /\bimport\s*\(/, label: 'import()' },
  { pattern: /\brequire\s*\(/, label: 'require()' },
  { pattern: /\bprocess\b/, label: 'process' },
  { pattern: /__proto__/, label: '__proto__' },
  { pattern: /\.prototype\b/, label: '.prototype' },
  { pattern: /\bglobalThis\b/, label: 'globalThis' },
  { pattern: /\bself\b/, label: 'self' },
  { pattern: /\blocation\b/, label: 'location' },
  { pattern: /\bnavigator\b/, label: 'navigator' },
  { pattern: /\blocalStorage\b/, label: 'localStorage' },
  { pattern: /\bsessionStorage\b/, label: 'sessionStorage' },
  { pattern: /\bindexedDB\b/, label: 'indexedDB' },
  { pattern: /\bcrypto\b/, label: 'crypto' },
  { pattern: /\bsetTimeout\b/, label: 'setTimeout' },
  { pattern: /\bsetInterval\b/, label: 'setInterval' },
  { pattern: /\balert\s*\(/, label: 'alert()' },
  { pattern: /\bconfirm\s*\(/, label: 'confirm()' },
  { pattern: /\bprompt\s*\(/, label: 'prompt()' },
  { pattern: /https?:\/\//i, label: 'URL (http://)' },
  { pattern: /www\.[a-z0-9-]+\.[a-z]+/i, label: 'URL (www.*)' },
  { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/, label: 'IP Address' },
  { pattern: /\b[a-zA-Z0-9-]+\s*(?:\[dot\]|\(\.\)|\{dot\}|\sdot\s)\s*[a-zA-Z]{2,}/i, label: 'Obfuscated Domain' },
  { pattern: /<\/?[a-zA-Z0-9-]+.*?>/, label: 'HTML Tags' },
  { pattern: /\b(?:String\.fromCharCode|atob|btoa|unescape|decodeURI|decodeURIComponent)\b/, label: 'String Encoding/Decoding API' },
  { pattern: /(?:setInfo|addControl|annotate)\s*\([^;{}]*(?:\+|`|\$\{)[^;{}]*\)/, label: 'Dynamic String in UI Function' },
  { pattern: /(?:setInfo|addControl|annotate)\s*\([^;{}]*\\[ux][^;{}]*\)/i, label: 'Escape Sequence in UI Function' },
];

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateUserCode(code: string): ValidationResult {
  if (!code || !code.trim()) {
    return { ok: false, reason: 'Code cannot be empty.' };
  }

  // Stage 1: Forbidden pattern scan
  for (const { pattern, label } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return {
        ok: false,
        reason: `🚫 Forbidden keyword detected: \`${label}\`\n\n` +
          `Only the simulation API is allowed:\n` +
          `  target, color, i, count, time, THREE, Math,\n` +
          `  addControl(), setInfo(), annotate()`
      };
    }
  }

  // Stage 2: Dry-run execution
  try {
    const fn = new Function(
      'i', 'count', 'target', 'color', 'THREE', 'time',
      'setInfo', 'annotate', 'addControl',
      code
    );

    const mockTarget = {
      set: () => {},
      copy: () => {},
      x: 0, y: 0, z: 0
    };
    const mockColor = {
      setHex: () => {},
      setHSL: () => {},
      setRGB: () => {},
      set: () => {},
      r: 1, g: 1, b: 1
    };
    const mockThree = {
      Vector3: class {
        constructor() { return mockTarget as any; }
      },
      Color: class {
        constructor() { return mockColor as any; }
      },
      MathUtils: {
        clamp: (v: number, a: number, b: number) => Math.max(a, Math.min(b, v)),
        lerp: (a: number, b: number, t: number) => a + (b - a) * t,
      }
    };
    const noop = () => {};
    const mockAddControl = (_id: string, _label: string, _min: number, _max: number, val: number) => val;

    fn(0, 100, mockTarget, mockColor, mockThree, 0.0, noop, noop, mockAddControl);

  } catch (e) {
    return {
      ok: false,
      reason: `❌ Code Error (simulation cannot run):\n\n${(e as Error).message}\n\n` +
        `Fix the error before saving or publishing.`
    };
  }

  return { ok: true };
}
