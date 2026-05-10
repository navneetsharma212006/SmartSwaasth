import { useState, useEffect, useCallback } from "react";
import { FiBell, FiClock, FiEdit2, FiSave, FiX } from "react-icons/fi";

function buildTimesFromMedicine(medicine) {
  if (medicine.schedule?.times?.length > 0) return [...medicine.schedule.times];
  if (medicine.dosageTimes?.length > 0) return [...medicine.dosageTimes];
  return [];
}

/** Both server flags must be on (explicit true) for reminders to run. */
export function remindersBothOn(medicine) {
  return (
    medicine.dailyDosageReminderEnabled === true &&
    medicine.expiryReminderEnabled === true
  );
}

export default function ScheduleManager({ medicine, onSave, onReminderToggle }) {
  const [schedule, setSchedule] = useState({
    enabled: false,
    times: [],
    dosage: "",
  });
  const [editing, setEditing] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [toggling, setToggling] = useState(false);

  const syncFromMedicine = useCallback(() => {
    const times = buildTimesFromMedicine(medicine);
    setSchedule({
      enabled: remindersBothOn(medicine),
      times,
      dosage:
        medicine.schedule?.dosage ||
        (medicine.dosagePerDay ? `${medicine.dosagePerDay}× daily` : ""),
    });
  }, [medicine]);

  useEffect(() => {
    syncFromMedicine();
  }, [
    medicine._id,
    medicine.updatedAt,
    medicine.schedule,
    medicine.dosageTimes,
    medicine.dosagePerDay,
    medicine.dailyDosageReminderEnabled,
    medicine.expiryReminderEnabled,
    syncFromMedicine,
  ]);

  const parseInstructions = (instructions) => {
    const patterns = {
      twice: ["twice", "two times"],
      thrice: ["thrice", "three times"],
      daily: ["daily", "every day"],
    };

    let times = [];
    const lower = instructions.toLowerCase();

    if (patterns.twice.some((p) => lower.includes(p))) {
      times = ["09:00", "21:00"];
    } else if (patterns.thrice.some((p) => lower.includes(p))) {
      times = ["08:00", "14:00", "20:00"];
    } else if (lower.includes("daily")) {
      times = ["09:00"];
    }

    return times;
  };

  useEffect(() => {
    if (buildTimesFromMedicine(medicine).length > 0) return;
    if (!medicine.dosageInstructions) return;
    const parsedTimes = parseInstructions(medicine.dosageInstructions);
    if (parsedTimes.length) {
      setSchedule((s) => ({ ...s, times: parsedTimes }));
    }
  }, [medicine._id, medicine.dosageInstructions]);

  const addTime = () => {
    if (newTime && !schedule.times.includes(newTime)) {
      setSchedule({ ...schedule, times: [...schedule.times, newTime].sort() });
      setNewTime("");
    }
  };

  const removeTime = (time) => {
    setSchedule({
      ...schedule,
      times: schedule.times.filter((t) => t !== time),
    });
  };

  const saveSchedule = () => {
    onSave(medicine._id, schedule);
    setEditing(false);
  };

  const handleReminderCheckbox = async (e) => {
    const enabled = e.target.checked;
    if (onReminderToggle) {
      setToggling(true);
      try {
        await onReminderToggle(enabled);
      } finally {
        setToggling(false);
      }
      return;
    }
    setSchedule({ ...schedule, enabled });
  };

  const checkboxDisabled = onReminderToggle ? toggling : !editing;
  const showTimesBlock =
    remindersBothOn(medicine) && schedule.times.length > 0;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiBell className="text-black/60" />
          <h4 className="font-medium">Medication Schedule</h4>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1 hover:bg-black/5 rounded"
          >
            <FiEdit2 />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={saveSchedule}
              className="p-1 hover:bg-black/5 rounded text-green-600"
            >
              <FiSave />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                syncFromMedicine();
              }}
              className="p-1 hover:bg-black/5 rounded"
            >
              <FiX />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 mb-3">
        <input
          type="checkbox"
          id={`reminders-${medicine._id}`}
          checked={remindersBothOn(medicine)}
          onChange={handleReminderCheckbox}
          disabled={checkboxDisabled}
          className="mt-1 rounded border-black/15"
        />
        <label htmlFor={`reminders-${medicine._id}`} className="text-sm cursor-pointer">
          <span className="font-medium">Enable reminders</span>
          <span className="mt-0.5 block text-xs text-black/55">
            Turns on daily dose notifications at your scheduled times and a one-time alert on the expiry date.
          </span>
        </label>
      </div>

      {editing && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Dosage (e.g., Take 2 pills twice daily)"
            value={schedule.dosage}
            onChange={(e) => setSchedule({ ...schedule, dosage: e.target.value })}
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
      )}

      {showTimesBlock && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-black/50">Reminder Times</p>
          <div className="flex flex-wrap gap-2">
            {schedule.times.map((time) => (
              <span
                key={time}
                className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-sm"
              >
                <FiClock className="text-xs" />
                {time}
                {editing && (
                  <button
                    type="button"
                    onClick={() => removeTime(time)}
                    className="ml-1 hover:text-red-600"
                  >
                    <FiX className="text-xs" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2 mt-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-md border border-black/15 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={addTime}
                className="rounded-md bg-black/5 px-3 py-1 text-sm hover:bg-black/10"
              >
                Add Time
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
