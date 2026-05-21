class ImageChannel < ApplicationCable::Channel
  def subscribed
    @image = Image.find(params[:id])
    stream_for @image

    return if read_only?

    @brush = {}
    @prev_brush = {}
    @participation = Image::Participation.create(image: @image, user: Current.user, open: true)
    @strokes = Hash.new do |h, k|
      h[k] = Image::Stroke.new(
        image: @image,
        participation: @participation
      )
    end
    stream_for @participation

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

    # XXX ideally the open state would be kept in-memory only; having it in the db
    #     creates inconsistency risks in case of unexpected crashes for example
    @participation.close
    broadcast_action({action: "leave", pid: @participation.id})
  end

  def cmd(data)
    return if read_only?

    data.delete("action")
    begin
      cmd = CanvasCommand.from_h data
    rescue ActiveModel::ValidationError => e
      broadcast_model_errors e.model
      return
    end
    return unless cmd.send?

    begin
      process_cmd cmd
    rescue ActiveRecord::StatementInvalid => e
      broadcast_error e.to_s
    end
  end

  def cmd_multi(c)
    c.cmds.each &method(:process_cmd)
  end

  def cmd_pinfo(c)
    html = ApplicationController.render(
      partial: "images/cursor",
      locals: {participation: @participation, pointer_id: c.pointer_id, device: c.type},
    )
    ImageChannel.broadcast_to(@image, {html: {sel: "#canvasContainer", html: html}})
  end

  def cmd_line(c)
    @strokes[c.pointer_id].push_cmd(c)
  end

  def cmd_endstroke(c)
    stroke = @strokes.delete(c.pointer_id)
    return if stroke.nil? || stroke.empty?

    stroke.add_brush_delta(
      @prev_brush.reject { |k, v| @brush[k] == v }.merge!(@brush)
    )
    @image.strokes << stroke
    @prev_brush = @brush
    @brush = {}
    broadcast_model_errors stroke
  end

  private
    def self.toast_html_message(content)
      html = ApplicationController.render(
        partial: "application/toast",
        locals: {content: content},
      )
      {html: {sel: "#toastContainer", where: "afterbegin", html: html}}
    end

    def read_only?
      params[:read_only] or not @image.editable_by? Current.user
    end

    def process_cmd(cmd)
      cmd_method = "cmd_#{cmd.class.cmd_type}"
      if respond_to? cmd_method
        send(cmd_method, cmd)
      end

      @brush[cmd.class] = cmd if cmd.stateful?
      broadcast_cmd cmd if cmd.broadcast?
    end

    def broadcast_model_errors(model)
      return if model.errors.empty?
      broadcast_error model.errors.full_messages.join(".\n")
    end

    def broadcast_error(err)
      # we could use turbo streams instead but for that we'd have to make up
      # a participation-specific turbo stream source, make the client subscribe to it from js
      # (because we can't access the participation from the view as it's entirely handled here
      # (ideally its lifetime should be tied to the connection)), then push updates via turbo;
      # this is all doable but feels like more effort than it's worth; the push itself would
      # use global ActionCable methods anyway so it's not like it would be more ergonomic either
      ImageChannel.broadcast_to(@participation, self.class.toast_html_message(err))
    end

    def broadcast_cmd(cmd)
      broadcast_action({action: "cmd", **cmd.to_h})
    end

    def broadcast_action(data)
      # TODO: avoid self-broadcasting if possible, or at least ignore clientside
      ImageChannel.broadcast_to(@image, data.merge({pid: @participation.id}))
    end
end
