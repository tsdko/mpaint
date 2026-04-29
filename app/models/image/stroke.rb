class Image::Stroke < ApplicationRecord
  belongs_to :image

  def empty?
    data.empty?
  end

  def add_brush_delta(brush)
    bwire =
      brush.map do |k, v|
        t, d = stored_from_wire(k, v)
        [t, *d]
      end
    self.data = [*bwire, *data]
  end

  def push_from_wire(t, wdata)
    self.created_at_delta_secs = Time.zone.now - image.created_at if empty?
    data << stored_from_wire(t, wdata)
  end

  def wire_data
    data.map do |d|
      wd = wire_from_stored(d)
      wd[1].merge({user_id: connection_id, action: wd[0]})
    end
  end

  private
    STORED_FROM_WIRE_HEADERS = {
      :line => "l",
      :color => "cl",
      :size => "sz",
      :antialias => "aal",
      :image => "img",
    }
    WIRE_FROM_STORED_HEADERS = STORED_FROM_WIRE_HEADERS.invert

    def stored_from_wire(t, data)
      sd =
        case t
        when :line
          # XXX this still feels quite inefficient, p1/p2 coordinates are usually very close to each other
          #     which means they could probably be delta'd at the very least
          #     (maybe even previous p2 with current p1?)
          l = [data['p1']['x'], data['p1']['y'], data['p2']['x'], data['p2']['y']]
          l << 1 if data['eraser']
          l
        when :color
          [data['r'], data['g'], data['b']]
        when :size
          [data['size']]
        when :antialias
          [data['antialias']]
        else
          raise "unsupported wire type #{t}"
        end
      [STORED_FROM_WIRE_HEADERS[t], sd]
    end

    def wire_from_stored(data)
      st = WIRE_FROM_STORED_HEADERS[data[0]]
      sd =
        case [st, *data[1..]]
        in [:line, x1, y1, x2, y2]
          {p1: {x: x1, y: y1}, p2: {x: x2, y: y2}}
        in [:line, x1, y1, x2, y2, eraser]
          {p1: {x: x1, y: y1}, p2: {x: x2, y: y2}, eraser: !!eraser}
        in [:color, r, g, b]
          {r: r, g: g, b: b}
        in [:size, s]
          {size: s}
        in [:antialias, a]
          {antialias: a}
        in [:image, d]
          {data: d}
        else
          raise "unsupported stored type #{data}"
        end
      [st, sd]
    end

end

