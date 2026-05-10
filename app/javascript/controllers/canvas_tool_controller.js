import { Controller } from "@hotwired/stimulus";

const toolDataProps = {
  "eyedropper": "colorPick",
  "move": "drag",
};

export default class extends Controller {
  static targets = ["canvas"];

  update(ev) {
    const tool = ev.currentTarget.value;
    this.canvasTarget.dataset.tool = tool;

    // adjust data attributes used by other controllers
    Object.keys(toolDataProps).filter(k => k !== tool).forEach(k => {
      delete this.canvasTarget.dataset[toolDataProps[k] + "Active"];
    });
    if(toolDataProps.hasOwnProperty(tool)) {
      this.canvasTarget.dataset[toolDataProps[tool] + "Active"] = true;
    }
  }
}
