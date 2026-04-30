class Image::Participation < ApplicationRecord
  belongs_to :image
  belongs_to :user, optional: true
end
