class ErrorsController < ApplicationController
  allow_unauthenticated_access

  def not_found
    render_error(404)
  end

  def internal_server_error
    render_error(500)
  end
end
