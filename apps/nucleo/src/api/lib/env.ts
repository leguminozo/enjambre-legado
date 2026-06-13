export function getEnvOrThrow(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Falta variable de entorno requerida: ${key}`);
  }
  return val;
}
