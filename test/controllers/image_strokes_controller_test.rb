require "test_helper"

class ImageStrokesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get image_image_strokes_url images(:one).id
    assert_response :success
  end
end
