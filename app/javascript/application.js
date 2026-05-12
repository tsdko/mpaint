// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails

import "@hotwired/turbo-rails";
Turbo.session.drive = false;
import "controllers";
import * as Util from "util";
import * as ImageCanvas from "image_canvas";

[
  "DOMContentLoaded",
  "turbo:frame-load",
].forEach(event => document.addEventListener(event, () => Util.localizeDateTimes()));
window.Util = Util;
window.ImageCanvas = ImageCanvas;
