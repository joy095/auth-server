import { Context, Hono } from "hono";
import createAuth from "./lib/auth.js";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { csrf } from "hono/csrf";

type Bindings = {
  PORT?: string;
  NODE_ENV: string;
  APP_BASE_URL: string;
  MAIL_FROM: string;
  DATABASE_URL: string;
  MAIL_HMAC_SECRET: string;
  EMAIL_SERVER_URL: string;
  ALLOWED_ORIGINS: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const isDev = process.env.NODE_ENV === "development";

const getOrigins = () => {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000", "http://localhost:5173"];
};

// ─── Global Middlewares ───────────────────────────────────────────────────────

app.use("*", secureHeaders());

if (isDev) {
  app.use("*", logger());
}

app.use(
  "*",
  cors({
    origin: getOrigins(),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "x-signature"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"], // Allow browser to read Set-Cookie
  }),
);

app.use(
  "*",
  csrf({
    origin: getOrigins(),
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.all("/api/auth/**", async (c: Context) => {
  try {
    const auth = createAuth();
    const res = await auth.handler(c.req.raw);

    if (res) return res;

    return c.json({ success: true }, 200);
  } catch (err) {
    console.error("Better-auth handler error", {
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      path: c.req.path,
    });

    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Ok from auth Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

export default {
  port: process.env.PORT || 5000,
  fetch: app.fetch,
  hostname: process.env.HOSTNAME || "localhost",
};
