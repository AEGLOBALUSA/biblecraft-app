/**
 * COPPA-Compliant Safe Names Generator
 * Generates safe display names from biblical characters and virtues
 * No free-text input, blocklist validation
 */

const PREFIXES = [
  "Brave",
  "Joyful",
  "Faithful",
  "Bold",
  "Wise",
  "Kind",
  "Strong",
  "Mighty",
  "Gentle",
  "Loyal",
];

const CHARACTERS = [
  "David",
  "Moses",
  "Esther",
  "Daniel",
  "Ruth",
  "Joseph",
  "Gideon",
  "Deborah",
  "Noah",
  "Samuel",
  "Jonah",
  "Elijah",
  "Joshua",
  "Samson",
  "Jonathan",
  "Mary",
  "Paul",
];

// Words that are blocklisted to prevent naming abuse
const BLOCKLIST = [
  "admin",
  "god",
  "jesus",
  "hell",
  "demon",
  "devil",
  "kill",
  "death",
  "hate",
  "evil",
  "sex",
  "porn",
  "nude",
  "bad",
  "stupid",
  "dumb",
  "fake",
  "test",
  "null",
  "undefined",
];

/**
 * Generate a random safe name combining prefix + character + number
 */
export function generateSafeName(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  return `${prefix}${character}${number}`;
}

/**
 * Validate a display name against the blocklist
 * Returns true if name is safe, false if it violates blocklist
 */
export function isNameSafe(name: string): boolean {
  if (!name || name.length < 3 || name.length > 50) {
    return false;
  }

  const lowerName = name.toLowerCase().trim();

  // Check blocklist
  for (const blocked of BLOCKLIST) {
    if (lowerName.includes(blocked)) {
      return false;
    }
  }

  // Check for non-alphanumeric (except basic punctuation)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return false;
  }

  return true;
}

/**
 * Generate a batch of safe name suggestions
 */
export function generateSafeNameSuggestions(count: number = 5): string[] {
  const names = new Set<string>();
  while (names.size < count) {
    names.add(generateSafeName());
  }
  return Array.from(names);
}
