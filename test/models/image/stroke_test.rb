require "test_helper"

class Image::StrokeTest < ActiveSupport::TestCase
  setup do
    @stroke = image_strokes(:one)
  end

  test "should convert from wire format to DB format" do
    s = Image::Stroke.new(image_id: @stroke.image_id)
    s.push_cmd(CanvasCommand::Line.new(pointer_id: 0, p1: {"x" => 1, "y" => 2}, p2: {"x" => 3, "y" => 4}))
    s.push_cmd(CanvasCommand::Line.new(pointer_id: 0, p1: {"x" => 3, "y" => 4}, p2: {"x" => 6, "y" => 9}))
    s.add_brush_delta({
      color: CanvasCommand::Color.new(r: 255, g: 0, b: 255),
      size: CanvasCommand::Size.new(size: 10),
    })
    assert_equal @stroke.data, s.data
  end

  test "should convert from DB format to wire format" do
    wire = [
      {t: "color", r: 255, g: 0, b: 255},
      {t: "size", size: 10},
      {t: "line", p1: {x: 1, y: 2}, p2: {x: 3, y: 4}},
      {t: "line", p1: {x: 3, y: 4}, p2: {x: 6, y: 9}},
    ].map { |d| d.update({pid: @stroke.participation_id}) }

    assert_equal wire, @stroke.wire_data
  end

  test "should support converting image strokes to wire format" do
    assert_nothing_raised do
      Image::Stroke.new(
        participation: @stroke.participation,
        data: [["img", "data:image/gif;base64,R0lGODlhAQABAPABAAAAAP///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="]],
      ).wire_data
    end
  end
end
