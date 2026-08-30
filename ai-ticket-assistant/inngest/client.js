import { Inngest } from "inngest";

// Local dev runs against the Inngest dev server (isDev). In production
// (NODE_ENV=production) the client talks to Inngest Cloud using
// INNGEST_EVENT_KEY (for sending events) and INNGEST_SIGNING_KEY (for the
// serve endpoint) - both read from the environment by the SDK automatically.
const isDev = process.env.NODE_ENV !== "production";

export const inngest = new Inngest({
  id: "ticketing-system",
  isDev,
});
