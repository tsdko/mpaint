class CreateImageStrokes < ActiveRecord::Migration[8.1]
  def change
    create_table :image_strokes do |t|
      t.references :image, null: false, foreign_key: true
      t.float :created_at_delta_secs
      t.string :connection_id
      t.json :data
    end
  end
end
