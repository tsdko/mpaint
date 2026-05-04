class ImageChannel < ApplicationCable::Channel
  def subscribed
    @image = Image.find(params[:id])
    stream_for @image

    return if read_only?

    @brush = {}
    @prev_brush = {}
    @participation = Image::Participation.create(image: @image, user: Current.user)
    @strokes = Hash.new do |h, k|
      h[k] = Image::Stroke.new(
        image: @image,
        participation: @participation
      )
    end

    join_data = {action: "join", pid: @participation.id}
    join_data[:user] = {
      id: @participation.user.id,
      name: @participation.user.to_s,
      level: @participation.user.level,
    }
    broadcast_action(join_data)
  end

  def unsubscribed
    return if read_only?

    broadcast_action({action: "leave", pid: @participation.id})
  end

  def cmd(data)
    return if read_only?

    data.delete("action")

    cmd = CanvasCommand::from_h data

    begin
      send("cmd_#{cmd.class.cmd_type}", cmd)
    rescue NoMethodError
    end

    @brush[cmd.class] = cmd if cmd.stateful?
    broadcast_cmd cmd if cmd.broadcast?
  end

  def cmd_line(c)
    @strokes[nil].push_cmd(c)
  end

  def cmd_endstroke(c)
    stroke = @strokes.delete(nil)
    return if stroke.nil? || stroke.empty?

    stroke.add_brush_delta(
      @prev_brush.reject { |k, v| @brush[k] == v }.merge!(@brush)
    )
    @image.strokes << stroke
    @prev_brush = @brush
    @brush = {}
    # TODO: pass .errors if present? maybe via a private user-specific channel
  end

  private
    def read_only?
      params[:read_only] or not @image.editable_by? Current.user
    end

    def broadcast_cmd(cmd)
      broadcast_action({action: "cmd", **cmd.to_h})
    end

    def broadcast_action(data)
      # TODO: avoid self-broadcasting if possible, or at least ignore clientside
      ImageChannel.broadcast_to(@image, data.merge({pid: @participation.id}))
    end
end
