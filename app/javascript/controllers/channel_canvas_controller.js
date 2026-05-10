import { Controller } from "@hotwired/stimulus";

const drawingTools = new Set([undefined, "brush", "eraser"]);
const pointers = new Map();

// This controller sends "channel-canvas:cmd" events. These can be listened on
// by channel listeners in order to relay canvas commands to the channel.

export default class extends Controller {
  static targets = ["canvas", "colorPicker"];

  #perform(cmd, data) {
    this.dispatch("cmd", {detail: [cmd, data]});
  }

  #onPosInput(inState, inp) {
    if(inState.last?.x === inp.x && inState.last?.y === inp.y)
      return;
    inState.last = {x: inp.x, y: inp.y};
    if(inp.down) {
      if(inState.lastDown && drawingTools.has(this.canvasTarget.dataset.tool)) {
        // 1px jaggy brush strokes sometimes disappear with fractional coords
        const aligned = Math.floor;
        const p1 = {
          x: aligned(inState.lastDown.x),
          y: aligned(inState.lastDown.y),
        };
        const p2 = {
          x: aligned(inp.x),
          y: aligned(inp.y),
        };
        const line = {pointer_id: inp.id, p1: p1, p2: p2};
        this.#perform("line", line);
      }
      inState.lastDown = {x: inp.x, y: inp.y};
    } else {
      inState.lastDown = null;
    }
    this.#perform("pos", {pointer_id: inp.id, x: inp.x, y: inp.y});
  }

  sendPinfo(ev) {
    this.#perform("pinfo", {pointer_id: ev.pointerId, type: ev.pointerType});
  }

  movePointer(ev) {
    const inState = pointers.getOrInsert(ev.pointerId, {});
    const [x, y] = Util.localPos(ev, this.canvasTarget);
    this.#onPosInput(inState, {id: ev.pointerId, x: x, y: y, down: Util.pointerIsDown(ev)});
  }

  hidePointer(ev) {
    this.#perform("poshide", {pointer_id: ev.pointerId});
    pointers.delete(ev.pointerId);
  }

  endStroke(ev) {
    this.#perform("endstroke", {pointer_id: ev.pointerId});
  }

  changeTool(ev) {
    switch(this.canvasTarget.dataset.tool) {
    case "brush":
      const rgba = Util.rgbaFromCSS(this.colorPickerTarget.value);
      this.#perform("multi", {data: [
        {t: "color", r: rgba[0], g: rgba[1], b: rgba[2]},
        {t: "drawop", drawop: "source-over"},
      ]});
      break;
    case "eraser":
      this.#perform("multi", {data: [
        {t: "color", r: 0, g: 0, b: 0},
        {t: "drawop", drawop: "destination-out"},
      ]});
      break;
    }
  }

  changeSize(ev) {
    this.#perform("size", {size: Number.parseFloat(ev.target.value)});
  }

  changeColor(ev) {
    const rgba = Util.rgbaFromCSS(ev.target.value);
    this.#perform("color", {r: rgba[0], g: rgba[1], b: rgba[2]});
  }

  changeAntialias(ev) {
    this.#perform("antialias", {antialias: ev.target.value === "true"});
  }
}
