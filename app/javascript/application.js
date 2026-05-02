// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails

import * as Util from "util";
import * as ImageCanvas from "image_canvas";

Util.localizeDateTimes();
window.Util = Util;
window.ImageCanvas = ImageCanvas;
