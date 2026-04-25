# Pin npm packages by running ./bin/importmap

pin_all_from "app/javascript/channels", under: "channels"

pin "application"
pin "@rails/actioncable", to: "@rails--actioncable.js" # @8.1.300
