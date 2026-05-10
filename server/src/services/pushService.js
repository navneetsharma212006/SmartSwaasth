/**
 * Push notification sending service.
 * Uses the web-push library to send notifications to subscribed users.
 */
const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY?.trim();
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim();
const VAPID_EMAIL = process.env.VAPID_EMAIL?.trim() || "mailto:admin@smartswaasth.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("[push] VAPID configured");
} else {
  console.warn("[push] VAPID keys not set — push notifications disabled");
}

/**
 * Send push notification to all active subscriptions for a user.
 * @param {string} userId - MongoDB user ID
 * @param {object} payload - { title, body, url, tag, actions }
 */
async function sendPushToUser(userId, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return; // Push not configured
  }

  const subscriptions = await PushSubscription.find({
    userId,
    active: true,
  });

  if (subscriptions.length === 0) return;

  const payloadStr = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          payloadStr
        );
      } catch (err) {
        // If subscription is expired/invalid (410 Gone or 404), deactivate it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.findByIdAndUpdate(sub._id, { active: false });
          console.log(`[push] Deactivated expired subscription ${sub._id}`);
        } else {
          console.error(`[push] Error sending to ${sub._id}:`, err.message);
        }
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  console.log(
    `[push] Sent notification to ${sent}/${subscriptions.length} subscriptions for user ${userId}`
  );
}

/**
 * Send push notification to multiple users at once
 * @param {string[]} userIds - Array of MongoDB user IDs
 * @param {object} payload - { title, body, url, tag, actions }
 */
async function sendPushToUsers(userIds, payload) {
  await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload))
  );
}

module.exports = { sendPushToUser, sendPushToUsers };
