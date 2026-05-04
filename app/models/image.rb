class Image < ApplicationRecord
  has_many :messages, as: :target, dependent: :destroy
  has_many :strokes, dependent: :destroy
  has_many :participations, dependent: :destroy

  validates :width, presence: true
  validates :height, presence: true

  def last_stroke
    strokes.order(id: :desc).first
  end

  def editable_by?(user)
    user.level >= min_edit_level
  end

  def messageable_by?(user)
    editable_by? user
  end

  def to_s
    title || "Image #{id}"
  end
end
