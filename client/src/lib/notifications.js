// lib/notifications.js
import { listMedicines } from "./api.js";

export async function initNotifications() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

export async function scheduleReminders() {
  const medicines = await listMedicines();
  
  medicines.forEach(medicine => {
    if (medicine.schedule?.enabled && medicine.schedule.times?.length) {
      medicine.schedule.times.forEach(time => {
        scheduleReminder(medicine.name, time, medicine.schedule.dosage);
      });
    }
  });
}

function scheduleReminder(medicineName, time, dosage) {
  const [hours, minutes] = time.split(":");
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  let delay = reminderTime - now;
  if (delay < 0) {
    delay += 24 * 60 * 60 * 1000; // Schedule for tomorrow
  }
  
  setTimeout(() => {
    showNotification(medicineName, dosage);
    // Reschedule for next day
    scheduleReminder(medicineName, time, dosage);
  }, delay);
}

function showNotification(medicineName, dosage) {
  if (Notification.permission === "granted") {
    new Notification("SmartSwaasth Reminder", {
      body: dosage ? `Time to take ${medicineName}: ${dosage}` : `Time to take ${medicineName}`,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: medicineName,
      requireInteraction: true,
    });
  }
}