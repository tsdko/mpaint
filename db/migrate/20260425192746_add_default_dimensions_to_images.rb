class AddDefaultDimensionsToImages < ActiveRecord::Migration[8.1]
  def change
    change_column_default :images, :width, from: 0, to: 640
    change_column_default :images, :height, from: 0, to: 400
  end
end
