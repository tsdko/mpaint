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

  def same_name_participants
    if user.is_anonymous?
      image.participations.where(open: true, user: nil)
    else
      User.joins(:image_participations)
        .where(
          display_name: user.display_name,
          image_participations: {image_id: image.id, open: true},
        ).distinct
    end.count
  end

  def display_name
    name = user.display_name
    name += "＃#{id}" if same_name_participants > 1
    name
  end
end
