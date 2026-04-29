require "test_helper"

class MessagesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @message = messages(:one)
  end

  test "should get index" do
    get messages_url
    assert_redirected_to new_session_url

    post session_url, params: {email_address: @user.email_address, password: "password"}

    get messages_url
    assert_response :success
  end

  test "should get show" do
    get message_url @message.id
    assert_response :success
  end
end
