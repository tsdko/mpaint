class Image < ApplicationRecord
  has_many :messages, as: :target, dependent: :destroy
  has_many :strokes

  validates :width, presence: true
  validates :height, presence: true
end
