// Replaces src/lib/config.ts (which reads expo-constants) in Node.
export const API_BASE_URL = (process.env.SHASHTNA_API_URL ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');
export const APP_VERSION = 'acceptance';
export const EAS_PROJECT_ID = '';
