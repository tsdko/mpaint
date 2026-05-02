// Utilities for drawing lines on html5 canvas.

function set_pixel(d, x, y, c) {
  let idx = (y*d.width + x)*4;
  d.data[idx] = c.r;
  d.data[idx+1] = c.g;
  d.data[idx+2] = c.b;
  d.data[idx+3] = 255;
}

function line_bresenham(x0, y0, x1, y1, c) {
  let dx = Math.abs(x1 - x0),
      dy = Math.abs(y1 - y0),
      flipped = false;
  const data = new ImageData(dx+1, dy+1);

  if(dx < dy) {
    [dx, dy] = [dy, dx];
    [x0, y0] = [y0, x0];
    [x1, y1] = [y1, x1];
    flipped = true;
  }

  const d_init = 2*dy -   dx,
        d_eq   = 2*dy,
        d_inc  = 2*dy - 2*dx;

  for(let d = d_init, y = y0, x = x0; x != x1; x0 < x1 ? ++x : --x) {
    if(flipped)
      set_pixel(data, y, x, c);
    else
      set_pixel(data, x, y, c);

    if(d < 0) {
      d += d_eq;
    } else {
      d += d_inc;
      y0 < y1 ? ++y : --y;
    }
  }

  return window.createImageBitmap(data);
}

export function sharp(ctx, p1, p2, brush) {
  // For context: sharp line drawing used to be implemented as a canvas
  // SVG filter, first found in this stackoverflow comment:
  // https://stackoverflow.com/questions/195262/can-i-turn-off-antialiasing-on-an-html-canvas-element/68372384#comment130069699_68372384
  // and fully reproduced below:
  // url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="f" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer></filter></svg>#f');
  // Despite the hackiness this actually works very well in Firefox
  // (at least as of version 150); the lines are exactly what you would
  // expect from a sharp line drawing function. Unfortunately on
  // Chromium-based browsers this filter is both extremely slow and
  // ends up creating extremely ugly, discontinuous lines.
  // This is why we ended up implementing line drawing manually.

  const xm = Math.min(p1.x, p2.x),
        ym = Math.min(p1.y, p2.y);
  p1.x -= xm;
  p2.x -= xm;
  p1.y -= ym;
  p2.y -= ym;

  // implementation reminder: whatever method you use, make sure
  // it respects ctx.globalCompositeOperation
  // TODO: support thicker lines
  line_bresenham(p1.x, p1.y, p2.x, p2.y, brush?.color ?? {r: 0, g: 0, b: 0})
    .then(bitmap => ctx.drawImage(bitmap, xm, ym));
}

export function regular(ctx, p1, p2, brush) {
  const {r, g, b} = brush?.color ?? {r: 0, g: 0, b: 0};
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = brush?.size ?? 1;
  ctx.lineCap = "round";
  ctx.filter = "none";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}
