class MessagesController < ApplicationController
  allow_unauthenticated_access only: [:show]

  def index
    @messages = Message.all
  end

  def show
    @message = Message.find(params[:id])
  end

  def new
    @message = Message.new(author_id: Current.user.id)
  end

  def edit
    @message = Message.find(params[:id])
    raise User::PermissionError unless @message.editable_by? Current.user
  end

  def update
    @message = Message.find(params[:id])
    if @message.update(message_update_params)
      redirect_to @message.target
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def create
    @message = Message.new(author_id: Current.user.id, **message_new_params)
    if @message.save
      redirect_to @message.target
    else
      render :new, status: :unprocessable_entity
    end
  end

  private
    def message_new_params
      params.expect(message: [:content, :target_id, :target_type])
    end

    def message_update_params
      params.expect(message: [:content])
    end
end
