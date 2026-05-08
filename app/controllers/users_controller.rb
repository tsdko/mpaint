class UsersController < ApplicationController
  allow_unauthenticated_access only: [:show]

  def edit
    @user = User.find(params[:id])
    raise User::PermissionError unless @user.id == Current.user.id or Current.user.is_admin?
  end

  def show
    @user = User.find(params[:id])
    respond_to do |format|
      format.html
      format.json { render json: @user.as_json(only: [:id, :level, :display_name, :created_at]) }
    end
  end
end
