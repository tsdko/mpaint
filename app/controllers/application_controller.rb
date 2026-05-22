class ApplicationController < ActionController::Base
  include Authentication
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  default_form_builder ApplicationFormBuilder

  rescue_from Exception, :with => :rescue_exception

  private

    def rescue_exception(exception)
      case exception
      when User::PermissionError
        render "error", status: 403, locals: {message: "Access denied."}
      when ActiveRecord::RecordNotFound
        render "error", status: 404, locals: {message: "Not found."}
      else
        raise exception
      end
    end
end
