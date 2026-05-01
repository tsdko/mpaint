// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails

import "channels/image_channel";
import { localizeDateTimes, localPos, pointerIsDown } from "util";

localizeDateTimes();
window.Util = {localPos: localPos, pointerIsDown: pointerIsDown};
