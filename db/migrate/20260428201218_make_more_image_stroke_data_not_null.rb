class MakeMoreImageStrokeDataNotNull < ActiveRecord::Migration[8.1]
  def change
    change_column_null :image_strokes, :created_at_delta_secs, false
    change_column_null :image_strokes, :connection_id, false
  end
end
