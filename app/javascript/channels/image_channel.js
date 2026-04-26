import consumer from "channels/consumer";

class CanvasRelay {
  constructor(perform) {
    this.perform = perform;

    this.lastClientDown = null;
  }

  #onMouseMove() {
    let lastClientX, lastClientY;
    let lastDownClientX = null, lastDownClientY = null;
    return e => {
      if(lastClientX == e.clientX && lastClientY == e.clientY)
        return;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      const r = canvas.getBoundingClientRect();
      if(e.buttons & 1) {
        console.log("clicked while moving", this.lastClientDown, e);
        if(this.lastClientDown !== null) {
          const p1 = {
            x: this.lastClientDown.x - r.left,
            y: this.lastClientDown.y - r.top,
          };
          const p2 = {
            x: e.clientX - r.left,
            y: e.clientY - r.top,
          };
          this.perform("line", {p1: p1, p2: p2});
        }
        this.lastClientDown = {x: e.clientX, y: e.clientY};
      } else {
        this.lastClientDown = null;
      }
      this.perform("pos", {x: e.clientX - r.left, y: e.clientY - r.top});
    };
  }

  #onMouseOut() {
    // redundant => so this refers to CanvasRelay instead of whatever the method is attached to
    return () => this.perform("poshide");
  }

  install(canvas) {
    canvas.addEventListener("mousemove", this.#onMouseMove());
    canvas.addEventListener("mouseout", this.#onMouseOut());
  }

  uninstall(canvas) {
    canvas.removeEventListener("mousemove", this.#onMouseMove());
    canvas.removeEventListener("mouseout", this.#onMouseOut());
  }
}

class UserCursorManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.cursors = {};
  }

  show(uid, x, y) {
    if(!this.cursors[uid]) {
      const cur = document.createElement("div");
      cur.dataset.userId = uid;
      cur.classList.add("userCursor");
      cur.textContent = "↖";
      document.body.appendChild(cur);
      this.cursors[uid] = cur;
    }
    const cur = this.cursors[uid];
    const r = canvas.getBoundingClientRect();
    // left/top can't be referenced by attr(data-*) so we assign styles directly
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
    this.relay = new CanvasRelay((action, params) => this.perform(action, params));
    this.canvas = document.getElementById("imageCanvas");
    this.userCursors = new UserCursorManager(this.canvas);
    this.userColors = {}; // TODO implement color changes
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
    this.relay.install(this.canvas);
  },

  uninstall() {
    this.relay.uninstall(this.canvas);
  },

  received(data) {
    console.log("got", data);
    switch(data.action) {
    case "pos":
      this.userCursors.show(data.user_id, data.x, data.y);
      break;
    case "poshide":
      this.userCursors.hide(data.user_id);
      break;
    case "line":
      const ctx = canvas.getContext("2d");
      // TODO: make sure user colors are trustable, either structured tuples or a single integer (not a direct string)
      ctx.strokeStyle = this.userColors[data.user_id] || "black";
      ctx.moveTo(data.p1.x, data.p1.y);
      ctx.lineTo(data.p2.x, data.p2.y);
      ctx.stroke();
      break;
    }
  },
});
