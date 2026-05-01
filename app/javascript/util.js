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

export const rgbaFromCSS = (() => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  return (cssColor) => {
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
})();
