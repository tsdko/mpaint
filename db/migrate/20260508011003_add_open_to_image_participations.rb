class AddOpenToImageParticipations < ActiveRecord::Migration[8.1]
  def change
    add_column :image_participations, :open, :boolean, default: false, null: false
  end
end
