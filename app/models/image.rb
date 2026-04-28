class Image < ApplicationRecord
  has_many :messages, as: :target, dependent: :destroy

  validates :path, presence: true
  validates :width, presence: true
  validates :height, presence: true
end
