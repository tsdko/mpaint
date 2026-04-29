# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_29_193546) do
  create_table "image_strokes", force: :cascade do |t|
    t.string "connection_id", null: false
    t.float "created_at_delta_secs", null: false
    t.json "data", default: [], null: false
    t.integer "image_id", null: false
    t.index ["image_id"], name: "index_image_strokes_on_image_id"
  end

  create_table "images", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "height", default: 400, null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.integer "width", default: 640, null: false
  end

  create_table "messages", force: :cascade do |t|
    t.integer "author_id"
    t.string "content"
    t.datetime "created_at", null: false
    t.integer "target_id"
    t.string "target_type"
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_messages_on_author_id"
    t.index ["target_type", "target_id"], name: "index_messages_on_target"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "image_strokes", "images"
  add_foreign_key "messages", "users", column: "author_id"
  add_foreign_key "sessions", "users"
end
