class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :image_participations
  has_many :sent_messages, class_name: "Message", foreign_key: "author_id"
  has_many :received_messages, class_name: "Message", as: :target, dependent: :destroy

  module Level
    USER = 50
    ADMIN = 1000
    MAX = 10000
  end

  validates :display_name, length: { maximum: 32 }
  validates :level, numericality: { in: Level::USER..Level::ADMIN }
  normalizes :email_address, with: ->(e) { e.strip.downcase }

  class PermissionError < StandardError; end

  def recent_received_messages
    received_messages.order(created_at: :desc).limit(10)
  end

  def to_s
    display_name.presence || "user ##{id}"
  end

  def is_admin?
    level >= Level::ADMIN
  end
end
