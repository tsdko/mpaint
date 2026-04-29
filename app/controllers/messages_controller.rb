class MessagesController < ApplicationController
  allow_unauthenticated_access only: [:show]

  def index
    @messages = Message.all
  end

  def show
    @message = Message.find(params[:id])
  end
end
