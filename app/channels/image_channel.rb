class ImageChannel < ApplicationCable::Channel
  def subscribed
    @image = Image.find(params[:id])

    @brush = {}
    @prev_brush = {}
    @strokes = Hash.new do |h, k|
      h[k] = Image::Stroke.new(
        image: @image,
        connection_id: connection.connection_identifier(),
      )
    end
    stream_for @image
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def pos(data)
    broadcast_action(data)
  end

  def poshide(data)
    endstroke(data)
    broadcast_action(data)
  end

  def size(data)
    @brush[:size] = data
    broadcast_action(data)
  end

  def antialias(data)
    @brush[:antialias] = data
    broadcast_action(data)
  end

  def color(data)
    @brush[:color] = data
    broadcast_action(data)
  end

  def line(data)
    @strokes[data['pointer_id']].push_from_wire(:line, data)
    broadcast_action(data)
  end

  def endstroke(data)
    stroke = @strokes.delete(data['pointer_id'])
    return if stroke.nil? || stroke.empty?

    stroke.add_brush_delta(
      @prev_brush.reject { |k, v| @brush[k] == v }.merge!(@brush.reject{ |k, _| @prev_brush.key?(k) })
    )
    # TODO: how do you check for errors here?
    @image.strokes << stroke
    @prev_brush = @brush
    @brush = {}
    # TODO: return error if there was one?
  end

  private
    def broadcast_action(data)
      # TODO: avoid self-broadcasting if possible, or at least ignore clientside
      ImageChannel.broadcast_to(@image, data.merge({user_id: connection.connection_identifier()}))
    end
end
