class RemovePathFromImages < ActiveRecord::Migration[8.1]
  def change
    remove_column :images, :path, :string
  end
end
