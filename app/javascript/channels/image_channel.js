import consumer from "channels/consumer";
import * as Util from "util";

class CanvasRelay {
  #DRAWING_TOOLS = new Set([undefined, "brush", "eraser"]);

  #CANVAS_SEL = "#imageCanvas";
  #PICKER_SEL = "#colorPicker";
  #LISTENERS = {
    [this.#CANVAS_SEL]: [
      ["pointerenter", this.#onPointerEnter],
      ["pointermove", this.#onPointerMove],
      ["pointerout", this.#onPointerOut],
      ["pointerup", this.#onPointerUpCancel],
      ["pointercancel", this.#onPointerUpCancel],
    ],
    "input[type=radio][name=tool]": [["change", this.#onToolChange]],
    [this.#PICKER_SEL]: [["change", this.#onColorChange]],
    "#brushSize": [["change", this.#onSizeChange]],
    "input[type=radio][name=brushAntialias]": [["change", this.#onAntialiasChange]],
  }

  constructor(rootElem, perform) {
    this.perform = perform;

    this.rootElem = rootElem;
    this.canvas = this.rootElem.querySelector(this.#CANVAS_SEL);
    this.pointers = new Map();

    // ensure all listeners can access the relay via `this`
    for(const ls of Object.values(this.#LISTENERS)) {
      for(const l of ls) {
        l[1] = l[1].bind(this);
      }
    }
  }

  #onPosInput(inState, inp) {
    if(inState.last?.x === inp.x && inState.last?.y === inp.y)
      return;
    inState.last = {x: inp.x, y: inp.y};
    if(inp.down) {
      if(inState.lastDown && this.#DRAWING_TOOLS.has(this.canvas.dataset.tool)) {
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
        const line = {p1: p1, p2: p2};
        this.perform("line", line);
      }
      inState.lastDown = {x: inp.x, y: inp.y};
    } else {
      inState.lastDown = null;
    }
    this.perform("pos", {pointer_id: inp.id, x: inp.x, y: inp.y});
  }

  #onPointerEnter(ev) {
    this.perform("pinfo", {pointer_id: ev.pointerId, type: ev.pointerType});
  }

  #onPointerMove(ev) {
    const inState = this.pointers.getOrInsert(ev.pointerId, {});
    const [x, y] = Util.localPos(ev, this.canvas);
    this.#onPosInput(inState, {id: ev.pointerId, x: x, y: y, down: Util.pointerIsDown(ev)});
  }

  #onPointerOut(ev) {
    this.perform("poshide", {pointer_id: ev.pointerId});
    this.pointers.delete(ev.pointerId);
  }

  #onPointerUpCancel(ev) {
    this.perform("endstroke", {pointer_id: ev.pointerId});
  }

  #onToolChange(ev) {
    switch(this.canvas.dataset.tool) {
    case "brush":
      const picker = document.querySelector(this.#PICKER_SEL);
      const rgba = Util.rgbaFromCSS(picker.value);
      this.perform("color", {r: rgba[0], g: rgba[1], b: rgba[2]});
      this.perform("drawop", {drawop: "source-over"});
      break;
    case "eraser":
      this.perform("color", {r: 0, g: 0, b: 0});
      this.perform("drawop", {drawop: "destination-out"});
      break;
    }
  }

  #onSizeChange(ev) {
    this.perform("size", {size: Number.parseFloat(ev.target.value)});
  }

  #onColorChange(ev) {
    const rgba = Util.rgbaFromCSS(ev.target.value);
    this.perform("color", {r: rgba[0], g: rgba[1], b: rgba[2]});
  }

  #onAntialiasChange(ev) {
    this.perform("antialias", {antialias: ev.target.value === "true"})
  }

  #setupEventListeners(op) {
    if(op !== "add" && op !== "remove")
      throw `unsupported event listener setup operation: ${op}`;

    const listeners = Object.entries(this.#LISTENERS)
                       .map(([sel, ls]) => [sel, ls, this.rootElem.querySelectorAll(sel)]);
    for(const [sel, ls, elems] of listeners) {
      if(elems.length < 1)
        throw `required element(s) not found: ${sel}`;

      for(const el of elems) {
        for(const [evName, l] of ls) {
          el[op + "EventListener"](evName, l);
        }
      }
    }
  }

  install() {
    this.#setupEventListeners("add");
  }

  uninstall() {
    this.#setupEventListeners("remove");
  }
}

class ParticipantCursorManager {
  #DEVICE_SYMBOLS = {
    touch: "☝️",
    mouse: "🖱️",
    pen: "🖊️",
    unknown: "❓",
  }

  constructor(canvas, participants) {
    this.canvas = canvas;
    this.participants = participants;
    this.userCursors = {};
  }

  #getOrMakeElement(pid, poid) {
    let cur = (this.userCursors[pid] ?? {})[poid];
    if(cur)
      return cur;

    // get the root div so the reference is still alive after calling appendChild
    cur = document.importNode(document.getElementById("userCursor").content, true)
                .querySelector("div");
    // unhide only after we have the position
    cur.classList.add("hidden");
    const participant = this.participants.get(pid);
    let userName = participant?.name;
    // TODO: ideally this suffix would get added for every non-unique user
    // (track currently joined username counts, add to all if non-unique)
    if(!participant?.id)
      userName += `＃${pid}`;
    cur.querySelector(".userCursorName").textContent = userName;
    document.body.appendChild(cur);
    let curs = this.userCursors[pid];
    if(!curs)
      curs = this.userCursors[pid] = {};
    curs[poid] = cur;
    this.#brushUpdated(pid, poid);
    return cur;
  }

  updateDevice(pid, poid, info) {
    const dev = this.#DEVICE_SYMBOLS[info?.type] || this.#DEVICE_SYMBOLS.unknown;
    this.#getOrMakeElement(pid, poid).querySelector(".userCursorDevice").textContent = dev;
  }

  show(pid, poid, x, y) {
    const cur = this.#getOrMakeElement(pid, poid);
    const r = this.canvas.getBoundingClientRect();
    cur.style.left = window.scrollX + r.left + x + "px";
    cur.style.top = window.scrollY + r.top + y + "px";
    cur.classList.remove("hidden");
  }

  brushUpdatedAll(pid) {
    for(const poid of Object.keys(this.userCursors[pid] ?? {}))
      this.#brushUpdated(pid, poid);
  }

  #brushUpdated(pid, poid) {
    const brush = this.participants.get(pid)?.brush;
    const cur = this.userCursors[pid][poid];
    cur.querySelector(".cursorPointer").style.filter = brush?.antialias ? "none" : Util.noAntialiasFilter;
    cur.querySelector(".cursorCircle").setAttribute("r", (brush?.size ?? 1)/2 + "px");
  }

  hide(pid, poid) {
    this.userCursors[pid][poid].remove();
    delete this.userCursors[pid][poid];
  }

  hideAll(pid) {
    const cursors = this.userCursors[pid] ?? {};
    this.userCursors[pid] = {};
    for(const cur of Object.values(cursors))
      cur.remove();
  }
}

export class ServerRelay {
  constructor(canvas) {
    this.canvas = canvas;
    // {pid → {id: int?, name: string?, brush: {...}}}
    this.participants = new Map();
    this.cursors = new ParticipantCursorManager(this.canvas, this.participants);
  }

  #getParticipant(pid) {
    return this.participants.getOrInsertComputed(pid, () => ({brush: {}}));
  }

  handleData(data) {
    if(data.action !== "cmd") {
      switch(data.action) {
      case "join":
        if(data.user)
          Object.assign(this.#getParticipant(data.pid), data.user);
        return;
      case "leave":
        this.participants.delete(data.pid);
        this.cursors.hideAll(data.pid);
        return;
      }
    }

    switch(data.t) {
    case "pinfo":
      this.cursors.updateDevice(data.pid, data.pointer_id, {type: data.type});
      break;
    case "pos":
      this.cursors.show(data.pid, data.pointer_id, data.x, data.y);
      break;
    case "poshide":
      this.cursors.hide(data.pid, data.pointer_id);
      break;
    case "color":
      this.#getParticipant(data.pid).brush.color = `rgb(${data.r}, ${data.g}, ${data.b})`;
      break;
    case "size":
      this.#getParticipant(data.pid).brush.size = data.size;
      this.cursors.brushUpdatedAll(data.pid);
      break;
    case "antialias":
      this.#getParticipant(data.pid).brush.antialias = data.antialias;
      this.cursors.brushUpdatedAll(data.pid);
      break;
    case "drawop":
      this.#getParticipant(data.pid).brush.drawop = data.drawop;
      this.cursors.brushUpdatedAll(data.pid);
      break;
    case "line":
      const ctx = this.canvas.getContext("2d");
      const brush = this.#getParticipant(data.pid)?.brush ?? {};
      ctx.strokeStyle = brush.color ?? "black";
      ctx.lineWidth = brush.size ?? 1;
      ctx.lineCap = "round";
      ctx.filter = brush.antialias ? "none" : Util.noAntialiasFilter;
      ctx.globalCompositeOperation = brush.drawop ?? "source-over";
      ctx.beginPath();
      ctx.moveTo(data.p1.x, data.p1.y);
      ctx.lineTo(data.p2.x, data.p2.y);
      ctx.stroke();
      break;
    case "image":
      const img = new Image();
      // FIXME: ideally this should block but right now "image" is only used for immutable
      //        single-image drawings anyway
      img.onload = () => this.canvas.getContext("2d").drawImage(img, 0, 0);
      img.src = data.data;
    }
  }
}

const imageSubscriber = (canvas, serverRelay) => ({
  initialized() {
    this.canvas = document.getElementById("imageCanvas");
    if(!this.canvas.dataset.readonly)
      this.relay = new CanvasRelay(document, (action, params) => this.perform("cmd", {t: action, ...params}));
    this.serverRelay = serverRelay;
  },

  connected() {
    this.install();
  },

  disconnected() {
    this.uninstall();
  },

  rejected() {
    this.uninstall();
  },

  install() {
    this.relay?.install();
  },

  uninstall() {
    this.relay?.uninstall();
  },

  received(data) {
    //console.log("got", data);
    this.serverRelay.handleData(data);
  },
});

export function imageSubscribe(id, canvas, serverRelay, options) {
  consumer.subscriptions.create({channel: "ImageChannel", id: id, ...options}, imageSubscriber(canvas, serverRelay));
};
