class Image::Participation < ApplicationRecord
  belongs_to :image
  belongs_to :user, optional: true
  has_many :strokes, class_name: "Image::Stroke"

  def close
    self.transaction do
      if strokes.empty?
        destroy
      else
        update(open: false)
      end
    end
  end
end
