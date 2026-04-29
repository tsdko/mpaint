class UsersController < ApplicationController
  allow_unauthenticated_access only: [:show]

  def show
    @user = User.find(params[:id])
  end
end
