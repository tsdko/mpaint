import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["input"];

  connect() {
    this.inputTarget.value = "#000000";
  }

  pick(ev) {
    if(!ev.currentTarget.dataset.colorPickActive || !Util.pointerIsDown(ev))
      return;

    const [x, y] = Util.localPos(ev, ev.currentTarget);
    const [r, g, b, a] = ev.currentTarget.getContext("2d").getImageData(Math.round(x), Math.round(y), 1, 1).data;
    this.inputTarget.value = `rgb(${r}, ${g}, ${b})`;
  }

  dispatchChange() {
    this.inputTarget.dispatchEvent(new Event("change"));
  }
}
