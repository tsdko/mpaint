class ImageChannel < ApplicationCable::Channel
  BRUSH_UPDATE_CMDS = Set[:size, :antialias, :color, :drawop]
  SILENT_CMDS = Set[:endstroke]

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
      join_data[:user] = {id: @participation.user.id, name: @participation.user.to_s}
    end
    broadcast_action(join_data)
  end

  def unsubscribed
    broadcast_action({action: "leave", pid: @participation.id})
  end

  def cmd(data)
    data.delete("action")
    t = data.delete("t")
    ct = t.camelize
    out_obj = CanvasCommand.const_get(ct).new(**data)

    out_data = out_obj.instance_values
    ts = t.to_sym

    begin
      send("cmd_#{t}", out_data)
    rescue NoMethodError
    end

    if BRUSH_UPDATE_CMDS.include? ts
      @brush[t.to_sym] = out_data
    end

    unless SILENT_CMDS.include? ts
      broadcast_action({action: "cmd", t: t, **out_data})
    end
  end

  def cmd_line(data)
    @strokes[data[:pointer_id]].push_from_wire(:line, data)
  end

  def cmd_endstroke(data)
    stroke = @strokes.delete(data[:pointer_id])
    return if stroke.nil? || stroke.empty?

    stroke.add_brush_delta(
      @prev_brush.reject { |k, v| @brush[k] == v }.merge!(@brush.reject{ |k, _| @prev_brush.key?(k) })
    )
    @image.strokes << stroke
    @prev_brush = @brush
    @brush = {}
    # TODO: pass .errors if present? maybe via a private user-specific channel
  end

  private
    def broadcast_action(data)
      # TODO: avoid self-broadcasting if possible, or at least ignore clientside
      ImageChannel.broadcast_to(@image, data.merge({pid: @participation.id}))
    end
end
