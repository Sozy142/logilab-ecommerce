import * as Sentry from "@sentry/node";
import { app } from "./app.js";
import { env } from "./lib/env.js";

// No-op if sentryDsn is unset (local dev never has it configured).
if (env.sentryDsn) {
  Sentry.init({ dsn: env.sentryDsn, environment: process.env.NODE_ENV ?? "production" });
}

app.listen(env.port, () => {
  console.log(`logilab-server-api listening on http://localhost:${env.port}`);
});
