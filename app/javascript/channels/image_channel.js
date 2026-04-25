import consumer from "channels/consumer";

class CanvasRelay {
  constructor(perform) {
    this.perform = perform;
    this.canvases = new Set();
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

  install(canvas) {
    canvas.addEventListener("mousemove", this.#onMouseMove());
  }

  uninstall(canvas) {
    canvas.removeEventListener("mousemove", this.#onMouseMove());
  }
}

consumer.subscriptions.create({channel: "ImageChannel", id: document.getElementById("image").dataset.id}, {

  initialized() {
    this.relay = new CanvasRelay((action, params) => this.perform(action, params));
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
    const canvas = document.getElementById("imageCanvas");
    this.relay.install(canvas);
  },

  uninstall() {
    const canvas = document.getElementById("imageCanvas");
    this.relay.uninstall(canvas);
  },

  received(data) {
    console.log("got", data);
  },
});
