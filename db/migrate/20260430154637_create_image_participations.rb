class CreateImageParticipations < ActiveRecord::Migration[8.1]
  class Image::Stroke < ApplicationRecord; end
  class Image::Participation < ApplicationRecord
    belongs_to :user, optional: true
  end

  def change
    create_table :image_participations do |t|
      t.belongs_to :image, null: false, foreign_key: true
      t.belongs_to :user, null: true, foreign_key: true

      t.column :created_at, :datetime
    end

    create_table :legacy_image_participations do |t|
      t.column :connection_id, :string, index: { unique: true }
    end

    reversible do |direction|
      direction.up do
        execute <<-SQL
              INSERT INTO legacy_image_participations
                          (connection_id)
          SELECT DISTINCT connection_id
                     FROM image_strokes;
        SQL
      end
    end

    change_table :image_strokes do |t|
      t.column :participation_id, :integer, null: true
    end

    reversible do |direction|
      direction.up do
        Image::Stroke.all
          .joins("JOIN legacy_image_participations ON legacy_image_participations.connection_id = image_strokes.connection_id")
          .update_all(participation_id: Arel.sql("legacy_image_participations.id"))

        # I would've just raw-sql'd this (could've saved both on queries and memory)
        # but I don't think we can safely do arithmetic on dates from within the db
        participation_data =
          Image::Stroke.select("image_id, min(created_at_delta_secs) delta_secs, legacy_image_participations.id participation_id")
            .joins("JOIN legacy_image_participations ON legacy_image_participations.connection_id = image_strokes.connection_id")
            .group(:image_id)
        images = Hash[Image.find(participation_data.map { |d| d.image_id }).map { |i| [i.id, i] }]
        participation_data.each do |np|
          Image::Participation.create!(
            id: np.participation_id,
            image_id: np.image_id,
            created_at: images[np.image_id].created_at + np.delta_secs,
          )
        end
      end
    end

    change_table :image_strokes do |t|
      t.change_null :participation_id, false
      t.foreign_key :image_participations, column: :participation_id
      t.change_null :connection_id, true, ""
    end
  end
end
