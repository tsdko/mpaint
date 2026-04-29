require "test_helper"

class ImageStrokesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get image_strokes_index_url
    assert_response :success
  end
end
