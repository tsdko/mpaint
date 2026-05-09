# Pin npm packages by running ./bin/importmap

pin_all_from "app/javascript/channels", under: "channels"

pin "line"
pin "image_canvas"
pin "util"
pin "application"
pin "@rails/actioncable", to: "@rails--actioncable.js" # @8.1.300
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
