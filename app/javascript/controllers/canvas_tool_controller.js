import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["canvas", "canvasContainer"];

  update(ev) {
    this.canvasTarget.dataset.tool = ev.currentTarget.value;
  }
}
