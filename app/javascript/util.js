export function localizeDateTimes() {
  const tz = Temporal.Now.timeZoneId();
  document.querySelectorAll("time[datetime]").forEach(t => {
    const local = Temporal.Instant.from(t.dateTime).toZonedDateTimeISO(tz);
    const target = t.dataset.isRelative ? "title" : "textContent";
    t[target] = local.toLocaleString();
  });
}

export function localPos(ev, elem) {
  const rect = elem.getBoundingClientRect();
  return [ev.clientX - rect.left, ev.clientY - rect.top];
}

export function pointerIsDown(ev) {
  if(ev.pointerType === "mouse")
    return ev.buttons & 1;
  return ev.pressure > 0;
};
