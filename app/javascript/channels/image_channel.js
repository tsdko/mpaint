import consumer from "channels/consumer";

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
      if(inState.lastDown && this.#DRAWING_TOOLS.has(canvas.dataset.tool)) {
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
    this.perform("antialias", {antialias: e.target.value === "true"})
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

class UserCursorManager {
  #DEVICE_SYMBOLS = {
    touch: "☝️",
    mouse: "🖱️",
    pen: "🖊️",
    unknown: "❓",
  }

  constructor(canvas, users) {
    this.canvas = canvas;
    this.users = users;
    this.cursors = {};
  }

  #getOrMakeElement(pid, poid) {
    const cid = pid + "/" + poid;
    let cur = this.cursors[cid];
    if(cur)
      return cur;

    // get the root div so the reference is still alive after calling appendChild
    cur = document.importNode(document.getElementById("userCursor").content, true)
                .querySelector("div");
    cur.querySelector(".userCursorName").textContent = this.users[pid]?.name ?? `名無し＃${pid}`;
    document.body.appendChild(cur);
    this.cursors[cid] = cur;
    return cur;
  }

  updateDevice(pid, poid, info) {
    const dev = this.#DEVICE_SYMBOLS[info?.type] || this.#DEVICE_SYMBOLS.unknown;
    this.#getOrMakeElement(pid, poid).querySelector(".userCursorDevice").textContent = dev;
  }

  show(pid, poid, x, y) {
    const cid = pid + "/" + poid;
    const cur = this.#getOrMakeElement(pid, poid);
    const r = this.canvas.getBoundingClientRect();
    cur.style.left = window.scrollX + r.left + x + "px";
    cur.style.top = window.scrollY + r.top + y + "px";
  }

  #hideCid(cid) {
    this.cursors[cid]?.remove();
    delete this.cursors[cid];
  }

  hide(pid, poid) {
    this.#hideCid(pid + "/" + poid);
  }

  hideAll(pid) {
    const toRemove = [...Object.keys(this.cursors).filter(cid => cid.startsWith(pid + "/"))];
    for(const cid of toRemove)
      this.#hideCid(cid);
  }
}

class ServerRelay {
  constructor(canvas) {
    this.canvas = canvas;
    // {pid → {id: int, name: string}}
    this.users = {};
    this.userCursors = new UserCursorManager(this.canvas, this.users);
    // {pid → {color: string, size: int}}
    this.userBrushes = new Map();
  }

  handleData(data) {
    //console.log("handleData", data);
    switch(data.action) {
    case "pinfo":
      this.userCursors.updateDevice(data.pid, data.pointer_id, {type: data.type});
      break;
    case "pos":
      this.userCursors.show(data.pid, data.pointer_id, data.x, data.y);
      break;
    case "join":
      if(data.user)
        this.users[data.pid] = data.user;
      break;
    case "leave":
      delete this.users[data.pid];
      // fallthrough
    case "poshide":
      if(data.pointer_id)
        this.userCursors.hide(data.pid, data.pointer_id);
      else
        this.userCursors.hideAll(data.pid);
      break;
    case "color":
      for(const comp of "rgb") {
        if(!Number.isInteger(data[comp]) || data[comp] < 0 || data[comp] > 0xff) {
          console.error("dropping invalid", comp, data[comp]);
          return;
        }
      }
      this.userBrushes.getOrInsert(data.pid, {}).color = `rgb(${data.r}, ${data.g}, ${data.b})`;
      break;
    case "size":
      if(!Number.isInteger(data.size) || data.size < 0 || data.size > 100) {
        console.error("dropping invalid size", data.size);
        return;
      }
      this.userBrushes.getOrInsert(data.pid, {}).size = data.size;
      break;
    case "antialias":
      this.userBrushes.getOrInsert(data.pid, {}).antialias = data.antialias;
      break;
    case "drawop":
      this.userBrushes.getOrInsert(data.pid, {}).drawop = data.drawop;
      break;
    case "line":
      const ctx = this.canvas.getContext("2d");
      const brush = this.userBrushes.get(data.pid) ?? {};
      ctx.strokeStyle = brush.color ?? "black";
      ctx.lineWidth = brush.size ?? 1;
      ctx.lineCap = "round";
      ctx.filter = brush.antialias ? "none" : "var(--no-antialias-filter)";
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
      this.relay = new CanvasRelay(document, (action, params) => this.perform(action, params));
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

window.ServerRelay = ServerRelay;
window.imageSubscribe = (id, canvas, serverRelay) => {
  consumer.subscriptions.create({channel: "ImageChannel", id: id}, imageSubscriber(canvas, serverRelay));
};
