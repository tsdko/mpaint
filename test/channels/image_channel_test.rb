require "test_helper"

class ImageChannelTest < ActionCable::Channel::TestCase
  test "brush state is round-tripped properly" do
    image = Image.create
    stub_connection current_user: users(:one)
    subscribe id: image.id

    stroke_cmds = [
      [
        CanvasCommand::Color.new(r: 30, g: 30, b: 30),
        CanvasCommand::Line.new(pointer_id: 0, p1: {x: 0, y: 0}, p2: {x: 5, y: 7}),
        CanvasCommand::Line.new(pointer_id: 0, p1: {x: 5, y: 7}, p2: {x: 8, y: 1}),
      ],
      [
        CanvasCommand::Color.new(r: 20, g: 10, b: 0),
        CanvasCommand::Line.new(pointer_id: 0, p1: {x: 10, y: 10}, p2: {x: 19, y: 8}),
        CanvasCommand::Line.new(pointer_id: 0, p1: {x: 19, y: 8}, p2: {x: 1, y: 1}),
      ],
    ]

    stroke_cmds.each do |cmds|
      cmds.each do |cmd|
        perform :cmd, cmd.to_h
      end
      perform :cmd, {t: "endstroke", pointer_id: 0}
    end

    def flat_stored_fields(cc)
      cc.stored_fields.map { |fld| fld.is_a?(Array) ? fld[0] : fld }
    end

    def adjusted_for_roundtrip(scmds)
      scmds.map do |s|
        s.map do |cmd|
          cmd.to_h.symbolize_keys.select do |k, v|
            [:t, *flat_stored_fields(cmd.class)].include? k
          end
        end
      end
    end

    roundtripped_cmds = image.strokes.map { |s| s.wire_data.map { |cmds| cmds.keep_if { |k, _| k != :pid }.symbolize_keys } }
    assert_equal adjusted_for_roundtrip(stroke_cmds), roundtripped_cmds
  end

  test "bulk commands are supported" do
    image = Image.create
    stub_connection current_user: users(:one)
    subscribe id: image.id

    stroke_cmds = [CanvasCommand::Multi.new(data: [
      CanvasCommand::Color.new(r: 255, g: 0, b: 255).to_h,
      CanvasCommand::Size.new(size: 10).to_h,
      CanvasCommand::Line.new(pointer_id: 0, p1: {x: 1, y: 2}, p2: {x: 3, y: 4}).to_h,
      CanvasCommand::Line.new(pointer_id: 0, p1: {x: 3, y: 4}, p2: {x: 6, y: 9}).to_h,
      CanvasCommand::Endstroke.new(pointer_id: 0).to_h,
    ])]

    stroke_cmds.each do |cmd|
      perform :cmd, cmd.to_h
    end

    assert_equal [image_strokes(:one).data], image.strokes.map(&:data)
  end
end
