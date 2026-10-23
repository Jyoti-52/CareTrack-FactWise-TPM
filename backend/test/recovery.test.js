import test from "node:test";
import assert from "node:assert/strict";
import { feverThresholdC, recoveryStatus } from "../src/utils/recovery.js";

const today = new Date("2026-10-23T12:00:00.000Z");
const record = (dateKey, celsius = 37.2) => ({ dateKey, celsius });

test("qualifies only three complete prior fever-free UTC days", () => {
  const result = recoveryStatus([
    record("2026-10-23", 37.1),
    record("2026-10-22"),
    record("2026-10-21"),
    record("2026-10-20"),
  ], today, 38);
  assert.equal(result.eligible, true);
  assert.deepEqual(result.feverFreeDays, ["2026-10-22", "2026-10-21", "2026-10-20"]);
});

test("missing measurement breaks the fever-free streak", () => {
  const result = recoveryStatus([record("2026-10-22"), record("2026-10-20")], today, 38);
  assert.equal(result.eligible, false);
  assert.equal(result.consecutiveFeverFreeDays, 1);
});

test("fever threshold is inclusive and resets the streak", () => {
  const result = recoveryStatus([
    record("2026-10-22"),
    record("2026-10-21", 38),
    record("2026-10-20"),
  ], today, 38);
  assert.equal(result.eligible, false);
  assert.equal(result.consecutiveFeverFreeDays, 1);
});

test("today never counts as a full fever-free day", () => {
  const result = recoveryStatus([
    record("2026-10-23"),
    record("2026-10-22"),
    record("2026-10-21"),
  ], today, 38);
  assert.equal(result.eligible, false);
  assert.equal(result.consecutiveFeverFreeDays, 2);
});

test("fever threshold is configurable and rejects out-of-range values", () => {
  const original = process.env.FEVER_THRESHOLD_C;
  process.env.FEVER_THRESHOLD_C = "37.5";
  assert.equal(feverThresholdC(), 37.5);
  process.env.FEVER_THRESHOLD_C = "not-a-number";
  assert.throws(() => feverThresholdC(), /between 30 and 45/);
  if (original === undefined) delete process.env.FEVER_THRESHOLD_C;
  else process.env.FEVER_THRESHOLD_C = original;
});
