class MakeImageDimensionsNotNull < ActiveRecord::Migration[8.1]
  class Image < ApplicationRecord; end

  def change
    Image.where(:width.nil?).update_all(width: 640)
    change_column_null :images, :width, false
    Image.where(:height.nil?).update_all(height: 400)
    change_column_null :images, :height, false
  end
end
