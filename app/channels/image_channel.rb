class ImageChannel < ApplicationCable::Channel
  def subscribed
    @image = Image.find(params[:id])

    @brush = {}
    @prev_brush = {}
    @participation = Image::Participation.create(image: @image, user: current_user)
    @strokes = Hash.new do |h, k|
      h[k] = Image::Stroke.new(
        image: @image,
        participation: @participation
      )
    end

    stream_for @image
    join_data = {action: "join", pid: @participation.id}
    if not current_user.nil?
      join_data[:user] = {id: @participation.user.id, name: @participation.user.email_address}
    end
    broadcast_action(join_data)
  end

  def unsubscribed
    broadcast_action({action: "leave", pid: @participation.id})
  end

  def pinfo(data)
    broadcast_action(data)
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
      ImageChannel.broadcast_to(@image, data.merge({pid: @participation.id}))
    end
end
