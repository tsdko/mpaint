import * as ImageChannel from "channels/image_channel";
import * as Util from "util";

// image canvas UI code
// all the network logic lives in image_channel as of now

function drawBrushSample(canvas, opts) {
  const ctx = canvas.getContext("2d");
  for(const [k, v] of Object.entries(opts)) {
    ctx[k] = v;
  }
  // canvas filters may get applied on the next event loop iteration
  return new Promise((resolve) => {
    setTimeout(() => {
      ctx.beginPath();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.moveTo(8, 8);
      ctx.lineTo(canvas.width - 8, canvas.height - 8);
      ctx.stroke();
      resolve();
    }, 0);
  });
}

function brushSizeCanvasSetup() {
  const bscContainer = document.getElementById("brushSizeButton");
  const bsc = document.getElementById("brushSizeCanvas");
  bsc.width = bscContainer.clientWidth;
  bsc.height = bscContainer.clientHeight;
}

function openableSetup() {
  document.querySelectorAll(".openableContainer").forEach(el => {
    const openable = el.querySelector(".openable");
    const toggle = el.querySelector(".openableToggle");
    if(!openable || !toggle)
      return;

    const closeListener = ev => {
      console.log(ev.target, openable.contains(ev.target));
      if(openable.contains(ev.target))
        return;
      openable.classList.add("hidden");
      removeCloseListener();
    };

    const removeCloseListener = () => document.removeEventListener("click", closeListener);
    toggle.addEventListener("click", () => {
      if(openable.classList.contains("hidden")) {
        openable.classList.remove("hidden");
        window.setTimeout(() => document.addEventListener("click", closeListener), 0);
      }
    });
  });
}

function canvasFilterSetup() {
  document.querySelectorAll("#imageCanvas, #brushSizeCanvas").forEach(canvas => {
    canvas.getContext("2d").filter = Util.noAntialiasFilter;
  });
}

function canvasDragSetup() {
  let last = {}, scrolling = false;
  const container = document.querySelector("#canvasContainer");
  container.addEventListener("pointermove", ev => {
    if(!(ev.buttons & 4) || ev.pointerType !== "mouse")
      return;

    const [x, y] = Util.localPos(ev, container);
    if(last.x && last.y) {
        container.scroll({
          left: container.scrollLeft - (x - last.x),
          top: container.scrollTop - (y - last.y),
          behavior: "instant",
        });
    }
    last.x = x;
    last.y = y;
  });
  container.addEventListener("pointerup", ev => {last = {}});
  container.addEventListener("pointercancel", ev => {last = {}});
  container.addEventListener("pointerout", ev => {last = {}});
}

// only called if not read-only
function canvasDrawSetup() {
  brushSizeCanvasSetup();
  openableSetup();

  const canvas = document.getElementById('imageCanvas');

  // all tools
  document.querySelectorAll("input[name=tool]").forEach(el => el.addEventListener("input", ev => {
    document.getElementById("imageCanvas").dataset.tool = ev.target.value;
  }));

  // eyedropper
  function pickCanvasColor(ev) {
    if(canvas.dataset.tool !== "eyedropper" || !Util.pointerIsDown(ev))
      return;
    const [x, y] = Util.localPos(ev, canvas);
    const [r, g, b, a] = canvas.getContext("2d").getImageData(Math.round(x), Math.round(y), 1, 1).data;
    colorPicker.value = `rgb(${r}, ${g}, ${b})`;
  }
  canvas.addEventListener("pointerdown", ev => pickCanvasColor(ev));
  canvas.addEventListener("pointermove", ev => pickCanvasColor(ev));
  canvas.addEventListener("pointerup", e => {
    if(canvas.dataset.tool !== "eyedropper")
      return;
    colorPicker.dispatchEvent(new Event("change"));
  });

  // brush size
  document.getElementById("brushSize").addEventListener("input", e => {
    drawBrushSample(brushSizeCanvas, {lineWidth: e.target.value});
  });

  // brush jaggy
  document.querySelectorAll("input[name=brushAntialias]").forEach(el => el.addEventListener("input", ev => {
    drawBrushSample(brushSizeCanvas, {filter: el.value === "true" ? "none" : Util.noAntialiasFilter});
  }));

  const brushSampleDefaults = {
    filter: Util.noAntialiasFilter,
    lineWidth: Number.parseFloat(document.querySelector("#brushSize").value),
    lineCap: "round",
    strokeStyle: "black",
  };
  drawBrushSample(brushSizeCanvas, brushSampleDefaults);

  // reset input state in case the browser remembered it
  document.querySelectorAll("input[type=radio]").forEach(el => {
    el.checked = el.hasAttribute("checked");
  });
  document.querySelectorAll("input[type=color]").forEach(el => {
    el.value = el.getAttribute("value");
  });
}

export function setup(options) {
  canvasFilterSetup();
  canvasDragSetup();
  if(!options?.readonly)
    canvasDrawSetup();
}

export async function connect(imageID, options) {
  const canvas = document.getElementById("imageCanvas");
  const sRelay = new ImageChannel.ServerRelay(canvas);
  const r = await fetch(`${document.documentElement.dataset.rootPath}images/${imageID}/strokes.json`);
  const j = await r.json();
  let n = 0;
  for(const ds of j) {
    for(const d of ds) {
      sRelay.handleData(d)

      // yield from time to time to avoid blocking entire page
      if(n++ % 1000 === 0)
        await new Promise(resolve => window.setTimeout(() => resolve(), 0));
    }
  }
  const users = {};
  const pr = await fetch(`${document.documentElement.dataset.rootPath}images/${imageID}/participations.json`);
  const participations = await pr.json();
  for(const p of participations) {
    let relayData;
    if(p.open) {
      let user = users[p.user_id];
      if(!user) {
        const reqID = p.user_id ?? "anonymous";
        user = await fetch(`${document.documentElement.dataset.rootPath}users/${reqID}.json`).then(r => r.json());
        users[p.user_id] = user;
      }
      // send over user data if the session is still open
      relayData = {action: "join", pid: p.id, user: {name: user.display_name, ...user}};
    } else {
      // otherwise make sure we don't keep any state for this participation by sending a leave
      relayData = {action: "leave", pid: p.id};
    }
    sRelay.handleData(relayData);
  }

  canvas.classList.remove("brightness-50");
  ImageChannel.imageSubscribe(imageID, canvas, sRelay, {read_only: options?.readonly});
}
