import Pusher from "pusher";

// To make this work, add the following to your .env.local:
// PUSHER_APP_ID=your_app_id
// PUSHER_KEY=your_key
// PUSHER_SECRET=your_secret
// PUSHER_CLUSTER=your_cluster

// Export an instance only if env vars are present, or dummy ones to prevent crashes
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "app_id",
  key: process.env.PUSHER_KEY || "key",
  secret: process.env.PUSHER_SECRET || "secret",
  cluster: process.env.PUSHER_CLUSTER || "eu",
  useTLS: true,
});
