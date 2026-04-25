class Image < ApplicationRecord
  validates :path, presence: true
  validates :width, presence: true
  validates :height, presence: true
end
