module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :uuid
    attr_accessor :current_user

    def connect
      set_current_user || reject_unauthorized_connection
      self.uuid = SecureRandom.urlsafe_base64
    end

    private
      def set_current_user
        if session = Session.find_by(id: cookies.signed[:session_id])
          self.current_user = session.user
        end
      end
  end
end
