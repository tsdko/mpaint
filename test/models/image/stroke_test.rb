require "test_helper"

class Image::StrokeTest < ActiveSupport::TestCase
  setup do
    @stroke = image_strokes(:one)
  end

  test "should convert from wire format to DB format" do
    s = Image::Stroke.new(image_id: @stroke.image_id)
    s.push_from_wire(:line, {"p1" => {"x" => 1, "y" => 2}, "p2" => {"x" => 3, "y" => 4}})
    s.push_from_wire(:line, {"p1" => {"x" => 3, "y" => 4}, "p2" => {"x" => 6, "y" => 9}})
    s.add_brush_delta({color: {"r" => 255, "g" => 0, "b" => 255}})
    assert_equal @stroke.data, s.data
  end

  test "should from DB format to wire format" do
    wire = [
      {action: :color, r: 255, g: 0, b: 255},
      {action: :line, p1: {x: 1, y: 2}, p2: {x: 3, y: 4}},
      {action: :line, p1: {x: 3, y: 4}, p2: {x: 6, y: 9}},
    ].map { |d| d.update({pid: @stroke.participation_id}) }

    assert_equal wire, @stroke.wire_data
  end
end
