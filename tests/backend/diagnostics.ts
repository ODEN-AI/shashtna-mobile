// Replaces src/lib/diagnostics.ts (React Native APIs) in Node.
export function recordError() {}
export function scrub(message: string) {
  return message;
}
export async function collectDiagnostics() {
  return { appVersion: 'acceptance', os: 'node', device: null, network: 'test', lastError: null };
}
