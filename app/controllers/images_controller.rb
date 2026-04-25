class ImagesController < ApplicationController
  def show
    @image = Image.find(params[:id])
  end

  def edit
    @image = Image.find(params[:id])
  end

  def new
    @image = Image.new
  end
end
