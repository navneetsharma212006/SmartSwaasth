/**
 * In-memory schedulers: run a single API instance, or use one leader / external queue for HA.
 * Optional: REMINDER_TZ (IANA), REMINDER_HOUR, REMINDER_MINUTE for expiry-day fire time (local calendar day).
 */
const cron = require("node-cron");
const schedule = require("node-schedule");
const Medicine = require("../models/Medicine");
const Notification = require("../models/Notification");
const { getIo } = require("../config/socket");
const { sendPushToUser } = require("./pushService");

/** @type {Map<string, import('node-cron').ScheduledTask>} */
const dosageCronTasks = new Map();

/** @type {Map<string, import('node-schedule').Job>} */
const expiryJobs = new Map();

const REMINDER_HOUR = Number(process.env.REMINDER_HOUR || 9);
const REMINDER_MINUTE = Number(process.env.REMINDER_MINUTE || 0);
const CRON_TZ = process.env.REMINDER_TZ || undefined;

/**
 * Calendar day of expiry in local time + configured reminder clock time.
 * @param {Date} expiryDate
 */
function expiryReminderFireDate(expiryDate) {
  const d = new Date(expiryDate);
  const y = d.getFullYear();
  const mo = d.getMonth();
  const day = d.getDate();
  return new Date(y, mo, day, REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
}

function stopAllDosageCrons() {
  for (const task of dosageCronTasks.values()) {
    task.stop();
  }
  dosageCronTasks.clear();
}

async function runDosageReminderForTime(timeStr) {
  const meds = await Medicine.find({
    dailyDosageReminderEnabled: true,
    dosageTimes: timeStr,
  }).lean();

  for (const m of meds) {
    try {
      const notif = await Notification.create({
        userId: m.userId,
        medicineId: m._id,
        type: "dosage",
        title: "Daily dose reminder",
        message: `Time to take ${m.name} (${timeStr}).`,
        read: false,
        meta: { dosageTime: timeStr },
      });
      
      const io = getIo();
      if (io) {
        io.emit("notification:new", { ...notif.toObject(), medicineId: { _id: m._id, name: m.name } });
      }

      // Send push notification
      sendPushToUser(m.userId.toString(), {
        title: "💊 Daily Dose Reminder",
        body: `Time to take ${m.name} (${timeStr}).`,
        url: "/dashboard",
        tag: `dosage-${m._id}-${timeStr}`,
      }).catch((err) => console.error("[push] dosage push failed", err.message));
    } catch (err) {
      console.error("[reminders] dosage notification failed", err.message);
    }
  }
}

async function rebuildDosageCrons() {
  stopAllDosageCrons();

  const meds = await Medicine.find({
    dailyDosageReminderEnabled: true,
    dosageTimes: { $exists: true, $not: { $size: 0 } },
  }).lean();

  const timeSet = new Set();
  for (const m of meds) {
    for (const t of m.dosageTimes || []) {
      if (typeof t === "string" && /^\d{2}:\d{2}$/.test(t)) {
        timeSet.add(t);
      }
    }
  }

  const opts = CRON_TZ ? { timezone: CRON_TZ } : {};

  for (const t of timeSet) {
    const [h, minute] = t.split(":").map(Number);
    if (
      !Number.isInteger(h) ||
      !Number.isInteger(minute) ||
      h < 0 ||
      h > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      continue;
    }
    const expr = `${minute} ${h} * * *`;
    if (typeof cron.validate === "function" && !cron.validate(expr)) {
      console.warn("[reminders] invalid cron for time", t);
      continue;
    }
    const task = cron.schedule(
      expr,
      () => {
        runDosageReminderForTime(t).catch((err) =>
          console.error("[reminders] dosage tick failed", err.message)
        );
      },
      opts
    );
    dosageCronTasks.set(t, task);
  }

  console.log(
    `[reminders] dosage: ${dosageCronTasks.size} daily cron slot(s) active`
  );
}

function cancelAllExpiryJobs() {
  for (const job of expiryJobs.values()) {
    try {
      job.cancel();
    } catch (_) {
      /* ignore */
    }
  }
  expiryJobs.clear();
}

function scheduleExpiryForMedicine(med) {
  const id = med._id.toString();
  if (expiryJobs.has(id)) {
    try {
      expiryJobs.get(id).cancel();
    } catch (_) {
      /* ignore */
    }
    expiryJobs.delete(id);
  }

  if (med.expiryReminderEnabled !== true) return;

  const when = expiryReminderFireDate(med.expiryDate);
  if (when.getTime() <= Date.now()) return;

  const job = schedule.scheduleJob(when, async () => {
    try {
      const fresh = await Medicine.findById(med._id).lean();
      if (!fresh || fresh.expiryReminderEnabled !== true) {
        expiryJobs.delete(id);
        return;
      }
      const notif = await Notification.create({
        userId: med.userId,
        medicineId: med._id,
        type: "expiry",
        title: "Expiry reminder",
        message: `${fresh.name} expires on ${when.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}. Check your supply.`,
        read: false,
        meta: { expiryDate: fresh.expiryDate },
      });
      
      const io = getIo();
      if (io) {
        io.emit("notification:new", { ...notif.toObject(), medicineId: { _id: med._id, name: fresh.name } });
      }

      // Send push notification
      sendPushToUser(med.userId.toString(), {
        title: "⚠️ Medicine Expiry Alert",
        body: `${fresh.name} expires on ${when.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}. Check your supply.`,
        url: "/dashboard",
        tag: `expiry-${med._id}`,
      }).catch((err) => console.error("[push] expiry push failed", err.message));
    } catch (err) {
      console.error("[reminders] expiry notification failed", err.message);
    } finally {
      expiryJobs.delete(id);
    }
  });

  expiryJobs.set(id, job);
}

async function rescheduleAllExpiryJobs() {
  cancelAllExpiryJobs();
  const meds = await Medicine.find({
    expiryReminderEnabled: true,
  }).lean();

  for (const m of meds) {
    scheduleExpiryForMedicine(m);
  }

  console.log(
    `[reminders] expiry: ${expiryJobs.size} one-time job(s) scheduled`
  );
}

async function refreshReminderSchedulers() {
  await rebuildDosageCrons();
  await rescheduleAllExpiryJobs();
}

let debounceTimer = null;
const DEBOUNCE_MS = 500;

function scheduleReminderRefresh() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    refreshReminderSchedulers().catch((err) =>
      console.error("[reminders] refresh failed", err.message)
    );
  }, DEBOUNCE_MS);
}

async function initReminderSchedulers() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  await refreshReminderSchedulers();
}

module.exports = {
  initReminderSchedulers,
  refreshReminderSchedulers,
  scheduleReminderRefresh,
  rebuildDosageCrons,
  rescheduleAllExpiryJobs,
};
