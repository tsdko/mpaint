import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["dataHolder"];
  static values = { lastX: Number, lastY: Number };

  #dataHolder(ev) {
    // dataHolderTarget is an optional element that can be specified if the
    // dragActive data attribute (used for determining whether or not dragging
    // with the primary mouse button is enabled) should be taken from an
    // element other than the currentTarget of the pointer move event
    return this.dataHolderTarget || ev.currentTarget;
  }

  #dragActive(ev) {
    return (this.#dataHolder(ev).dataset.dragActive && Util.pointerIsDown(ev)) ||
             ((ev.buttons & 4) && ev.pointerType === "mouse");
  }

  connect() {
    this.resetXY();
  }

  drag(ev) {
    if(!this.#dragActive(ev))
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
