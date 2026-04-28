class MakeImageStrokeDataNotNull < ActiveRecord::Migration[8.1]
  def change
    change_column_default :image_strokes, :data, from: nil, to: []
    change_column_null :image_strokes, :data, false
  end
end
