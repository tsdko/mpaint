// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails

import "controllers"
import * as Util from "util";
import * as ImageCanvas from "image_canvas";

Util.localizeDateTimes();
window.Util = Util;
window.ImageCanvas = ImageCanvas;
