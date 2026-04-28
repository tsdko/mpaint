import consumer from "channels/consumer";

class CanvasRelay {
  constructor(perform) {
    this.perform = perform;

    this.touches = new Map();
  }

  #onPosInput(inState, inp) {
    if(inState.last?.cx === inp.cx && inState.last?.cy === inp.cy)
      return;
    inState.last = {cx: inp.cx, cy: inp.cy};
    const r = canvas.getBoundingClientRect();
    if(inp.down) {
      if(inState.lastDown) {
        // 1px jaggy brush strokes sometimes disappear with fractional coords
        const aligned = Math.floor;
        const p1 = {
          x: aligned(inState.lastDown.cx - r.left),
          y: aligned(inState.lastDown.cy - r.top),
        };
        const p2 = {
          x: aligned(inp.cx - r.left),
          y: aligned(inp.cy - r.top),
        };
        const line = {p1: p1, p2: p2};
        if(canvas.dataset.tool === "eraser")
          line.eraser = true;
        this.perform("line", line);
      }
      inState.lastDown = {cx: inp.cx, cy: inp.cy};
    } else {
      inState.lastDown = null;
    }
    this.perform("pos", {input_id: inp.id, x: inp.cx - r.left, y: inp.cy - r.top});
  }

  #onMouseMove() {
    const mstate = {};
    return e => this.#onPosInput(mstate, {id: "mouse", cx: e.clientX, cy: e.clientY, down: e.buttons & 1});
  }

  #onSizeChange() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return ev => this.perform("size", {size: Number.parseFloat(ev.target.value)});
  }

  #onColorChange() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    return ev => {
      ctx.fillStyle = ev.target.value;
      ctx.fillRect(0, 0, 1, 1);
      const rgba = [...ctx.getImageData(0, 0, 1, 1).data];
      this.perform("color", {r: rgba[0], g: rgba[1], b: rgba[2]});
    };
  }

  #onAntialiasChange() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return e => {
      this.perform("antialias", {value: e.target.value === "true"})
    };
  }

  #onMouseOut() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return () => this.perform("poshide", {input_id: "mouse"});
  }

  #onTouch() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return ev => {
      for(const t of ev.changedTouches) {
        const inState = this.touches.getOrInsert(t.identifier, {});
        this.#onPosInput(inState, {id: t.identifier, cx: t.clientX, cy: t.clientY, down: true});
      }
    };
  }

  #onTouchEnd() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return ev => {
      for(const t of ev.changedTouches) {
        this.perform("poshide", {input_id: t.identifier});
        this.touches.delete(t.identifier);
      }
    };
  }

  install(controls) {
    controls.canvas.addEventListener("mousemove", this.#onMouseMove());
    controls.canvas.addEventListener("mouseout", this.#onMouseOut());
    controls.canvas.addEventListener("touchmove", this.#onTouch());
    controls.canvas.addEventListener("touchend", this.#onTouchEnd());
    controls.picker.addEventListener("change", this.#onColorChange());
    controls.sizeInput.addEventListener("change", this.#onSizeChange());
    controls.antialiasOn.addEventListener("change", this.#onAntialiasChange());
    controls.antialiasOff.addEventListener("change", this.#onAntialiasChange());
  }

  uninstall(controls) {
    controls.canvas.removeEventListener("mousemove", this.#onMouseMove());
    controls.canvas.removeEventListener("mouseout", this.#onMouseOut());
    controls.canvas.removeEventListener("touchmove", this.#onTouch());
    controls.canvas.removeEventListener("touchend", this.#onTouchEnd());
    controls.picker.removeEventListener("change", this.#onColorChange());
    controls.sizeInput.removeEventListener("change", this.#onSizeChange());
    controls.antialiasOn.removeEventListener("change", this.#onAntialiasChange());
    controls.antialiasOff.removeEventListener("change", this.#onAntialiasChange());
  }
}

class UserCursorManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.cursors = {};
  }

  show(uid, x, y) {
    if(!this.cursors[uid]) {
      // get the root div so the reference is still alive after calling appendChild
      const cur = document.importNode(document.getElementById("userCursor").content, true)
                    .querySelector("div");
      cur.querySelector(".userCursorName").textContent = uid;
      document.body.appendChild(cur);
      this.cursors[uid] = cur;
    }
    const cur = this.cursors[uid];
    const r = canvas.getBoundingClientRect();
    cur.style.left = window.scrollX + r.left + x + "px";
    cur.style.top = window.scrollY + r.top + y + "px";
  }

  hide(uid) {
    this.cursors[uid]?.remove();
    delete this.cursors[uid];
  }
}

consumer.subscriptions.create({channel: "ImageChannel", id: document.getElementById("image").dataset.id}, {
  initialized() {
    this.canvas = document.getElementById("imageCanvas");
    if(!this.canvas.dataset.readonly)
      this.relay = new CanvasRelay((action, params) => this.perform(action, params));
    this.userCursors = new UserCursorManager(this.canvas);
    // {uid → {color: string, size: int}}
    this.userBrushes = new Map();
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
    this.relay?.install({
      canvas: this.canvas,
      picker: document.querySelector("#colorPicker"),
      sizeInput: document.querySelector("#brushSize"),
      antialiasOn: document.querySelector("input[name=brushAntialias][value=true]"),
      antialiasOff: document.querySelector("input[name=brushAntialias][value=false]"),
    });
  },

  uninstall() {
    this.relay?.uninstall({
      canvas: this.canvas,
      picker: document.querySelector("#colorPicker"),
      sizeInput: document.querySelector("#brushSize"),
      antialiasOn: document.querySelector("input[name=brushAntialias][value=true]"),
      antialiasOff: document.querySelector("input[name=brushAntialias][value=false]"),
    });
  },

  received(data) {
    console.log("got", data);
    switch(data.action) {
    case "pos":
      this.userCursors.show(data.user_id + "/" + data.input_id, data.x, data.y);
      break;
    case "poshide":
      this.userCursors.hide(data.user_id + "/" + data.input_id);
      break;
    case "color":
      for(const comp of "rgb") {
        if(!Number.isInteger(data[comp]) || data[comp] < 0 || data[comp] > 0xff) {
          console.error("dropping invalid", comp, data[comp]);
          return;
        }
      }
      this.userBrushes.getOrInsert(data.user_id, {}).color = `rgb(${data.r}, ${data.g}, ${data.b})`;
      break;
    case "size":
      if(!Number.isInteger(data.size) || data.size < 0 || data.size > 100) {
        console.error("dropping invalid size", data.size);
        return;
      }
      this.userBrushes.getOrInsert(data.user_id, {}).size = data.size;
      break;
    case "antialias":
      this.userBrushes.getOrInsert(data.user_id, {}).antialias = data.value;
      break;
    case "line":
      const ctx = this.canvas.getContext("2d");
      const brush = this.userBrushes.get(data.user_id) ?? {};
      ctx.strokeStyle = brush.color ?? "black";
      ctx.lineWidth = brush.size ?? 1;
      ctx.lineCap = "round";
      ctx.filter = brush.antialias ? "none" : "var(--no-antialias-filter)";
      ctx.globalCompositeOperation = data.eraser ? "destination-out" : "source-over";
      if(data.eraser) {
        ctx.strokeStyle = "black";
      }
      ctx.beginPath();
      ctx.moveTo(data.p1.x, data.p1.y);
      ctx.lineTo(data.p2.x, data.p2.y);
      ctx.stroke();
      break;
    }
  },
});
