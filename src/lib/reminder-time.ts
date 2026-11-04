const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type LocalSchedule = {
  dateKey: string;
  hour: number;
  weekday: number;
};

export function getLocalSchedule(now: Date, timeZone: string): LocalSchedule {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const hour = Number(value("hour"));
  const weekday = WEEKDAYS.indexOf(value("weekday") ?? "");

  if (!year || !month || !day || !Number.isInteger(hour) || weekday < 0) {
    throw new Error(`No se pudo calcular la hora local para ${timeZone}`);
  }

  return { dateKey: `${year}-${month}-${day}`, hour, weekday };
}
