class UsersController < ApplicationController
  allow_unauthenticated_access only: [:show]

  def edit
    @user = User.find(params[:id])
    raise User::PermissionError unless @user.id == Current.user.id or Current.user.is_admin?
  end

  def show
    @user = if params[:id] == "anonymous"
      User::anonymous
    else
      User.find(params[:id])
    end

    respond_to do |format|
      format.html
      format.json { render json: @user.as_json(except: @user.class.sensitive_attributes) }
    end
  end
end
