import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static values = { lastX: Number, lastY: Number };

  connect() {
    this.resetXY();
  }

  drag(ev) {
    if(!(ev.buttons & 4) || ev.pointerType !== "mouse")
      return;

    const [x, y] = Util.localPos(ev, ev.currentTarget);
    const el = ev.currentTarget;
    if(this.lastXValue >= 0 && this.lastYValue >= 0) {
      el.scroll({
        left: el.scrollLeft - (x - this.lastXValue),
        top: el.scrollTop - (y - this.lastYValue),
        behavior: "instant",
      });
    }
    this.lastXValue = x;
    this.lastYValue = y;
  }

  resetXY() {
    this.lastXValue = this.lastYValue = -1;
  }
}
