/* =============================
      Challenge Token Module
      token.js
   ============================= */

//
// --- Base64URL helpers ---
//
// Disclaimer:
// This challenge token system is purely for fun and *not* secure or tamper-proof.
// It's client-side only, runs entirely in your browser on GitHub Pages,
// and anyone savvy enough can modify tokens or scores.
// No backend means no real cheat protection, just a silly keyboard smashing game.

function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(str);
}

//
// --- JSON → Token ---
//
export function createChallengeToken(score, deviceType = "unknown", name = "") {
  const payload = {
    name,
    score,
    deviceType,
    timestamp: Date.now()
  };

  const json = JSON.stringify(payload);
  const base = base64UrlEncode(json);

  return computeChecksum(base).then(checksum => {
    return `${base}.${checksum}`;
  });
}

//
// --- Token → JSON (validated) ---
//
export async function parseChallengeToken(token) {
  if (!token || !token.includes('.')) return null;

  const [base, checksum] = token.split('.');

  const expected = await computeChecksum(base);
  if (checksum !== expected) {
    console.warn("Token checksum mismatch! Tampered token.");
    return null;
  }

  try {
    const json = base64UrlDecode(base);
    return JSON.parse(json);
  } catch (e) {
    console.error("Token decode failed:", e);
    return null;
  }
}

//
// --- SHA256 checksum (first 8 chars) ---
//
async function computeChecksum(str) {
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", data);

  const hex = [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hex.substring(0, 8); // short & readable
}


// Wrapper alias for parsing token (decodeToken)
export async function decodeToken(token) {
  return await parseChallengeToken(token);
}

// Wrapper alias for creating token (encodeToken)
export async function encodeToken(score, deviceType, name = "") {
  
  return await createChallengeToken(score, deviceType, name);
}
