class ImagesController < ApplicationController
  allow_unauthenticated_access

  def index
    @images = Image.all
    @images = @images.where(min_edit_level: ..Current.user.level) if params[:is_editable]
  end

  def show
    @image = Image.find(params[:id])
  end

  def edit
    @image = Image.find(params[:id])
    raise User::PermissionError unless @image.editable_by? Current.user
  end

  def new
    @image = Image.new
  end

  def create
    @image = Image.create(image_params)
    respond_to do |format|
      format.html {
        if @image.valid?
          redirect_to edit_image_url(@image.id)
          return
        end
        render :new
      }
    end
  end

  private
    def image_params
      params.expect(image: [:title, :width, :height])
    end
end
