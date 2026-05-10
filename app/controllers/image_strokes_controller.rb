class ImageStrokesController < ApplicationController
  allow_unauthenticated_access

  def index
    @strokes = Image::Stroke.where(image_id: params[:image_id]).includes(:participation)
    respond_to do |format|
      format.html
      format.any(:xml, :json) { render request.format.to_sym => @strokes.map { |s| s.wire_data } }
    end
  end
end
