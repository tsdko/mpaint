class Current < ActiveSupport::CurrentAttributes
  attribute :session
  delegate :user, to: :session, allow_nil: true

  def user
    return User.anonymous if session.nil?
    session.user
  end
end
