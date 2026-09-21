import assert from "node:assert/strict";
import test from "node:test";
import { getLocalSchedule } from "../src/lib/reminder-time";

test("calculates date, hour and weekday in each user's time zone", () => {
  const instant = new Date("2026-09-18T13:00:00.000Z");

  assert.deepEqual(getLocalSchedule(instant, "UTC"), {
    dateKey: "2026-09-18",
    hour: 13,
    weekday: 5,
  });
  assert.deepEqual(getLocalSchedule(instant, "America/Bogota"), {
    dateKey: "2026-09-18",
    hour: 8,
    weekday: 5,
  });
});

test("rejects invalid IANA time zones", () => {
  assert.throws(() => getLocalSchedule(new Date(), "Mars/Olympus_Mons"));
});
