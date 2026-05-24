# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

(1..9).each do |i|
  User.create_with(
    password: "demopassword#{i}",
    password_confirmation: "demopassword#{i}",
    display_name: "Demo User #{i}",
   ).find_or_create_by(email_address: "demo#{i}@localhost")
end

(1..2).each do |i|
  Image.create_with(
    min_edit_level: 9000,
  ).find_or_create_by(title: "Empty Closed Image #{i}")
end

["User", "Image"].each do |target|
  target.constantize.all.each do |tobj|
    (1..2).each do |i|
      Message.create_with(content: "Sample Message #{i}", author: User.find(2))
        .find_or_create_by(target: tobj)
    end
  end
end
