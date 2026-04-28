class Image < ApplicationRecord
  has_many :messages, as: :target, dependent: :destroy
  has_many :strokes

  validates :path, presence: true
  validates :width, presence: true
  validates :height, presence: true
end
