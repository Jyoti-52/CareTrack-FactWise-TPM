import { dateKey } from "./http.js";

export function feverThresholdC() {
  const threshold = Number(process.env.FEVER_THRESHOLD_C || 38);
  if (!Number.isFinite(threshold) || threshold < 30 || threshold > 45) {
    throw new Error("FEVER_THRESHOLD_C must be a number between 30 and 45.");
  }
  return threshold;
}

export function recoveryStatus(records, now = new Date(), threshold = 38) {
  const temperatures = new Map(records.map((record) => [record.dateKey, record.celsius]));
  const feverFreeDays = [];
  for (let offset = 1; offset <= 3; offset += 1) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const key = dateKey(day);
    const celsius = temperatures.get(key);
    if (celsius === undefined || celsius >= threshold) break;
    feverFreeDays.push(key);
  }
  return {
    eligible: feverFreeDays.length === 3,
    consecutiveFeverFreeDays: feverFreeDays.length,
    feverFreeDays,
    thresholdC: threshold,
  };
}
