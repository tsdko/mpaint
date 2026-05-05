class Image::Stroke < ApplicationRecord
  belongs_to :image
  belongs_to :participation, class_name: "Image::Participation"

  def empty?
    data.empty?
  end

  def add_brush_delta(brush)
    bdata = brush.map { |_, v| stored_from_cmd(v) }
    self.data = [*bdata, *data]
  end

  def push_cmd(cmd)
    self.created_at_delta_secs = Time.zone.now - image.created_at if empty?
    data << stored_from_cmd(cmd)
  end

  def wire_data
    data.map do |d|
      wire_from_stored(d).merge({pid: participation.id})
    end
  end

  private
    STORED_CLASSES = CanvasCommand::all.filter do |cc|
      cc.respond_to? :stored_header and cc.respond_to? :stored_fields
    end.map do |cc|
      [cc.stored_header, cc]
    end.to_h

    def stored_from_cmd(cmd)
      visit_field = -> (obj, fld) do
        fld = [fld] unless fld.is_a? Array
        return obj if fld.empty?

        visit_field.call(obj.[](fld[0]), fld[1..])
      end

      cmd_h = cmd.to_h.deep_symbolize_keys
      [cmd.class.stored_header, *cmd.class.stored_fields.map { |f| visit_field.call(cmd_h, f) }]
    end

    def wire_from_stored(data)
      w = Hash.new do |h, k|
        h[k] = {}
      end

      visit_field = -> (hsh, fld, data) do
        fld = [fld] unless fld.is_a? Array
        if fld.length == 1
          hsh[fld[0]] = data
          return
        end
        visit_field.call(hsh[fld[0]], fld[1..], data)
      end

      cc = STORED_CLASSES[data[0]]
      raise "unsupported stored type #{data[0]}" if cc.nil?
      cc.stored_fields.each_with_index do |fpath, i|
        visit_field.call( w, fpath, data[i+1] )
      end

      w[:t] = cc.cmd_type
      w
    end
end

