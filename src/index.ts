import { Hono } from "hono";
import createAuth from "./lib/auth";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { csrf } from "hono/csrf";
import emailRoute from "./lib/nodeMailer";

const app = new Hono();

const PORT = process.env.PORT || 5000;
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
  }),
);

app.use(
  "*",
  csrf({
    origin: getOrigins(),
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route("/", emailRoute);

app.all("/api/auth/**", async (c) => {
  try {
    const auth = createAuth(process.env);
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

app.get("/", (c) => c.json({ status: "ok from auth server" }));

export default {
  port: PORT,
  fetch: app.fetch,
};
