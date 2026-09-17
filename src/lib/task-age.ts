const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getTaskAgeInDays(createdAt: Date, now = Date.now()) {
  return Math.max(0, Math.floor((now - createdAt.getTime()) / MS_PER_DAY));
}
