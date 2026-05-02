class AddLevelToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :level, :integer, null: false, default: 50
  end
end
