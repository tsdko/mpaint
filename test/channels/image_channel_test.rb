require "test_helper"

class ImageChannelTest < ActionCable::Channel::TestCase
  test "brush state is round-tripped properly" do
    image = Image.create
    stub_connection current_user: users(:one)
    subscribe id: image.id

    stroke_cmds = [
      [
        CanvasCommand::Color.new(r: 30, g: 30, b: 30),
        CanvasCommand::Line.new(p1: {x: 0, y: 0}, p2: {x: 5, y: 7}),
        CanvasCommand::Line.new(p1: {x: 5, y: 7}, p2: {x: 8, y: 1}),
      ],
      [
        CanvasCommand::Color.new(r: 20, g: 10, b: 0),
        CanvasCommand::Line.new(p1: {x: 10, y: 10}, p2: {x: 19, y: 8}),
        CanvasCommand::Line.new(p1: {x: 19, y: 8}, p2: {x: 1, y: 1}),
      ],
    ]

    stroke_cmds.each do |cmds|
      cmds.each do |cmd|
        perform :cmd, cmd.to_h.update({ t: cmd.cmd_type })
      end
      perform :cmd, {t: "endstroke"}
    end

    def with_symbol_types(scmds)
      scmds.map { |s| s.map { |cmd| cmd.to_h.symbolize_keys.update({ t: cmd.cmd_type }) } }
    end

    roundtripped_cmds = image.strokes.map { |s| s.wire_data.map { |cmds| cmds.keep_if { |k, _| k != :pid }.symbolize_keys } }
    assert_equal with_symbol_types(stroke_cmds), roundtripped_cmds
  end
end
