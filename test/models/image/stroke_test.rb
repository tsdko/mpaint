require "test_helper"

class Image::StrokeTest < ActiveSupport::TestCase
  setup do
    @stroke = image_strokes(:one)
  end

  test "should convert stroke data from wire format to DB format correctly" do
    s = Image::Stroke.new(image_id: @stroke.image_id)
    s.push_from_wire(:line, {"p1" => {"x" => 1, "y" => 2}, "p2" => {"x" => 3, "y" => 4}})
    s.push_from_wire(:line, {"p1" => {"x" => 3, "y" => 4}, "p2" => {"x" => 6, "y" => 9}})
    s.add_brush_delta({color: {"r" => 255, "g" => 0, "b" => 255}})
    assert_equal @stroke.data, s.data
  end
end
