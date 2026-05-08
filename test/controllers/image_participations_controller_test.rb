require "test_helper"

class ImageParticipationsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get image_image_participations_url images(:one).id, format: :json
    assert_response :success
  end
end
