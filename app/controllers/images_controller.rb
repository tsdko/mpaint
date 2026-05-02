class ImagesController < ApplicationController
  allow_unauthenticated_access

  def index
    @images = Image.all
    locals = {}
    if params.key? :is_editable
      locals[:is_editable] = ActiveRecord::Type::Boolean.new.cast(params[:is_editable])
      min_level = locals[:is_editable] ? ..Current.user.level : ((Current.user.level + 1)..)
      @images = @images.where(min_edit_level: min_level)
    end
    render locals: locals
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
