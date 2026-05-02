module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_session

    around_command :set_current_session_for_command

    def connect
      set_current_session
    end

    private
      def set_current_session_for_command
        Current.set(session: current_session) { yield }
      end

      def set_current_session
        if session = Session.find_by(id: cookies.signed[:session_id])
          self.current_session = session
        end
      end
  end
end
