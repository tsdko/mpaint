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

  def display_name
    name = user.display_name
    if user.is_anonymous?
      # TODO: ideally apply this to non-unique non-anonymous users as well
      #       (e.g. two different users on the same canvas with the same display name)
      #       (GROUP BY user display name on active participations HAVING count(*) > 1;
      #        unfortunately anons would have to have special handling anyway as their
      #        display name is set in ruby)
      name += "＃#{id}"
    end

    name
  end
end
