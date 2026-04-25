import consumer from "channels/consumer";

class CanvasRelay {
  constructor(perform) {
    this.perform = perform;
  }

  #onMouseMove() {
    let lastClientX, lastClientY;
    return e => {
      if(lastClientX == e.clientX && lastClientY == e.clientY)
        return;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      const r = canvas.getBoundingClientRect();
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
    }
  },
});
