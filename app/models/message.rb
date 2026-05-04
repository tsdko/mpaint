class Message < ApplicationRecord
  belongs_to :author, :class_name => "User"
  belongs_to :target, polymorphic: true

  validate :allowed_by_target

  def editable_by?(user)
    author == user
  end

  private
    def allowed_by_target
      errors.add(:target, "does not allow messaging in this context") unless target.messageable_by? author
    end
end
