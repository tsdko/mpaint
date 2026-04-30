class Image < ApplicationRecord
  has_many :messages, as: :target, dependent: :destroy
  has_many :strokes
  has_many :participations, dependent: :destroy

  validates :width, presence: true
  validates :height, presence: true

  def last_stroke
    strokes.order(id: :desc).first
  end

  def to_s
    title || "Image #{id}"
  end
end
