// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails

import "channels/image_channel";
import * as Util from "util";

Util.localizeDateTimes();
window.Util = Util;
