require "test_helper"

class CanvasCommandTest < ActiveSupport::TestCase
  test "both values of antialias work" do
    assert_nothing_raised do
      CanvasCommand::Antialias.new(antialias: true)
      CanvasCommand::Antialias.new(antialias: false)
    end
  end
end
