type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  env: string | undefined;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "leave-tracker",
    env: process.env.NODE_ENV,
    ...context,
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};
