class RemoveConnectionIdFromImageStrokes < ActiveRecord::Migration[8.1]
  def change
    remove_column :image_strokes, :connection_id, :string
    drop_table :legacy_image_participations
  end
end
