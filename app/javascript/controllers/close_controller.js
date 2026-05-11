import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["dataHolder"];
  static values = { lastX: Number, lastY: Number };

  close(ev) {
    this.element.remove();
  }
}
