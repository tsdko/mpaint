class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :sent_messages, class_name: "Message", foreign_key: "author_id"
  has_many :received_messages, class_name: "Message", as: :target, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  def recent_received_messages
    received_messages.order(created_at: :desc).limit(10)
  end

  def to_s
    email_address
  end
end
