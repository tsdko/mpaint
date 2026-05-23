class ApplicationController < ActionController::Base
  include Authentication
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  default_form_builder ApplicationFormBuilder

  rescue_from Exception, :with => :rescue_exception

  private

    def render_error(status, message: nil)
      render("errors/generic", locals: {status: status, message: message})
    end

    def rescue_exception(exception)
      case exception
      when User::PermissionError
        render_error(403, message: "Insufficient permissions. Make sure you are logged into the right account.")
      else
        raise exception
      end
    end
end
