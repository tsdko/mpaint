export default function localizeDateTimes() {
  const tz = Temporal.Now.timeZoneId();
  document.querySelectorAll("time[datetime]").forEach(t => {
    const local = Temporal.Instant.from(t.dateTime).toZonedDateTimeISO(tz);
    const target = t.dataset.isRelative ? "title" : "textContent";
    t[target] = local.toLocaleString();
  });
}
