import assert from "node:assert/strict";
import test from "node:test";
import { scheduledDateForWeek } from "../src/lib/routines";

test("finds this week's scheduled day without depending on completion date", () => {
  // Wednesday, 2026-10-28: this week's Monday and Tuesday are already due.
  assert.equal(scheduledDateForWeek("2026-10-28", 3, 1), "2026-10-26");
  assert.equal(scheduledDateForWeek("2026-10-28", 3, 2), "2026-10-27");
  assert.equal(scheduledDateForWeek("2026-10-28", 3, 3), "2026-10-28");
});

test("uses the previous week's day before the weekly recurrence arrives", () => {
  // Sunday still belongs to the week that began the previous Monday.
  assert.equal(scheduledDateForWeek("2026-11-01", 0, 1), "2026-10-26");
});
