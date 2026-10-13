/**
 * Computes a fast deterministic 32-bit hash of a string (FNV-1a variant)
 * Useful for caching explanations and unique identifiers
 *
 * @param {string} str - Input string
 * @returns {string} Hexadecimal hash string
 */
export function getCodeHash(str) {
  if (!str) return 'empty';
  
  // Normalize line endings and trailing whitespace for consistent hashing
  const normalized = str.replace(/\r\n/g, '\n').trim();
  
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

export default getCodeHash;
