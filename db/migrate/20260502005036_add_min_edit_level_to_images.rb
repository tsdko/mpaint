class AddMinEditLevelToImages < ActiveRecord::Migration[8.1]
  def change
    add_column :images, :min_edit_level, :integer, null: false, default: 25
  end
end
