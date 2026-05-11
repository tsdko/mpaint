import consumer from "channels/consumer";
import * as Util from "util";
import * as Line from "line";

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

    const ccr = document.querySelector("#canvasContainer").getBoundingClientRect();
    const cr = this.canvas.getBoundingClientRect();
    this.canvasMargins = {x: cr.left - ccr.left, y: cr.top - ccr.top};
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
    document.querySelector("#canvasContainer").appendChild(cur);
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
    cur.style.left = this.canvasMargins.x + x + "px";
    cur.style.top = this.canvasMargins.y + y + "px";
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
      if(data.toast) {
        let t = document.importNode(document.getElementById("toastTemplate").content, true).firstElementChild;
        t.querySelector(".toastContent").textContent = data.toast;
        document.querySelector("#toastContainer").prepend(t);
      }

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
      this.#getParticipant(data.pid).brush.color = (({r, g, b}) => ({r, g, b}))(data);
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
      const draw = brush.antialias ? Line.regular : Line.sharp;
      ctx.globalCompositeOperation = brush.drawop ?? "source-over";
      draw(ctx, data.p1, data.p2, brush);
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
  relayCmd(ev) {
    const [cmd, params] = ev.detail;
    this.perform("cmd", {t: cmd, ...params});
  },

  initialized() {
    this.canvas = document.getElementById("imageCanvas");
    this.relayCmd = this.relayCmd.bind(this);
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
    if(!this.canvas.dataset.readonly)
      document.addEventListener("channel-canvas:cmd", this.relayCmd);
  },

  uninstall() {
    if(!this.canvas.dataset.readonly)
      document.removeEventListener("channel-canvas:cmd", this.relayCmd);
  },

  received(data) {
    //console.log("got", data);
    this.serverRelay.handleData(data);
  },
});

export function imageSubscribe(id, canvas, serverRelay, options) {
  consumer.subscriptions.create({channel: "ImageChannel", id: id, ...options}, imageSubscriber(canvas, serverRelay));
};
