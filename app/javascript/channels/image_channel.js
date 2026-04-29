import consumer from "channels/consumer";

class CanvasRelay {
  constructor(perform) {
    this.perform = perform;

    this.pointers = new Map();
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
        const line = {pointer_id: inp.id, p1: p1, p2: p2};
        if(canvas.dataset.tool === "eraser")
          line.eraser = true;
        this.perform("line", line);
      }
      inState.lastDown = {cx: inp.cx, cy: inp.cy};
    } else {
      inState.lastDown = null;
    }
    this.perform("pos", {pointer_id: inp.id, x: inp.cx - r.left, y: inp.cy - r.top});
  }

  #isDown(ev) {
    if(ev.pointerType === "mouse")
      return ev.buttons & 1;
    return ev.pressure > 0;
  }

  #onPointerMove() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return ev => {
      const inState = this.pointers.getOrInsert(ev.pointerId, {});
      this.#onPosInput(inState, {id: ev.pointerId, cx: ev.clientX, cy: ev.clientY, down: this.#isDown(ev)});
    };
  }

  #onPointerOut() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return ev => {
      this.perform("poshide", {pointer_id: ev.pointerId});
      this.pointers.delete(ev.pointerId);
    };
  }

  #onPointerUpCancel() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return ev => {
      console.log("pointer up or cancel", ev);
      this.perform("endstroke", {pointer_id: ev.pointerId});
    };
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
      this.perform("antialias", {antialias: e.target.value === "true"})
    };
  }

  install(controls) {
    controls.canvas.addEventListener("pointermove", this.#onPointerMove());
    controls.canvas.addEventListener("pointerout", this.#onPointerOut());
    controls.canvas.addEventListener("pointerup", this.#onPointerUpCancel());
    controls.canvas.addEventListener("pointercancel", this.#onPointerUpCancel());
    controls.picker.addEventListener("change", this.#onColorChange());
    controls.sizeInput.addEventListener("change", this.#onSizeChange());
    controls.antialiasOn.addEventListener("change", this.#onAntialiasChange());
    controls.antialiasOff.addEventListener("change", this.#onAntialiasChange());
  }

  uninstall(controls) {
    controls.canvas.removeEventListener("pointermove", this.#onPointerMove());
    controls.canvas.removeEventListener("pointerout", this.#onPointerOut());
    controls.canvas.removeEventListener("pointerup", this.#onPointerUpCancel());
    controls.canvas.removeEventListener("pointercancel", this.#onPointerUpCancel());
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

class ServerRelay {
  constructor(canvas) {
    this.canvas = canvas;
    this.userCursors = new UserCursorManager(this.canvas);
    // {uid → {color: string, size: int}}
    this.userBrushes = new Map();
  }

  handleData(data) {
    console.log("handleData", data);
    switch(data.action) {
    case "pos":
      this.userCursors.show(data.user_id + "/" + data.pointer_id, data.x, data.y);
      break;
    case "poshide":
      this.userCursors.hide(data.user_id + "/" + data.pointer_id);
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
      this.userBrushes.getOrInsert(data.user_id, {}).antialias = data.antialias;
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
      this.relay = new CanvasRelay((action, params) => this.perform(action, params));
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
    //console.log("got", data);
    this.serverRelay.handleData(data);
  },
});

window.ServerRelay = ServerRelay;
window.imageSubscribe = (id, canvas, serverRelay) => {
  consumer.subscriptions.create({channel: "ImageChannel", id: id}, imageSubscriber(canvas, serverRelay));
};
