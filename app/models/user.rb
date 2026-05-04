class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :image_participations, class_name: "Image::Participation"
  has_many :sent_messages, class_name: "Message", foreign_key: "author_id"
  has_many :received_messages, class_name: "Message", as: :target, dependent: :destroy

  module Level
    ANONYMOUS = 25
    USER = 50
    ADMIN = 1000
    MAX = 10000
  end

  validates :display_name, length: { maximum: 32 }
  validates :level, numericality: { in: Level::ANONYMOUS..Level::ADMIN }
  normalizes :email_address, with: ->(e) { e.strip.downcase }

  class PermissionError < StandardError; end

  class << self
    def anonymous
      user = User.new(level: Level::ANONYMOUS, display_name: "名無し")
      user.freeze.readonly!
      user
    end
  end

  def recent_image_participations
    image_participations
      .select("image_participations.*, MAX(image_participations.created_at)")
      .group("image_participations.image_id")
      .order("image_participations.created_at DESC")
      .limit(5)
  end

  def recent_received_messages
    received_messages.order(created_at: :desc).limit(10)
  end

  def to_s
    display_name.presence || "user ##{id}"
  end

  def is_admin?
    level >= Level::ADMIN
  end

  def messageable_by?(user)
    user.level >= Level::USER
  end
end
