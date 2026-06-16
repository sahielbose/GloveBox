import { Inngest } from "inngest";

/**
 * Inngest client. Dev mode (no signing key, talks to the local Inngest dev
 * server) is on for `pnpm dev` and whenever INNGEST_DEV=1 (docker-compose sets
 * it). In a real production deploy, leave both unset and provide
 * INNGEST_SIGNING_KEY / INNGEST_EVENT_KEY to run against Inngest Cloud.
 */
export const inngest = new Inngest({
  id: "glovebox",
  isDev: process.env.INNGEST_DEV === "1" || process.env.NODE_ENV === "development",
});
