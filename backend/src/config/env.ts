export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? "5000", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-in-production",
};
