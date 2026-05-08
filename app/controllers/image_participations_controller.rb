class ImageParticipationsController < ApplicationController
  allow_unauthenticated_access

  def index
    @participations = Image::Participation.where(image_id: params[:image_id])
    respond_to do |format|
      format.json { render json: @participations }
    end
  end
end
