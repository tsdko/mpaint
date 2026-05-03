module CanvasCommand
  # Commands clients can send during drawing.
  # See also Image::Stroke for the stored equivalents.

  def self.from_wire(t, data)
    ct = t.camelize
    CanvasCommand.const_get(ct).new(**data)
  end

  class Base
    include ActiveModel::Model

    def cmd_type
      self.class.name.demodulize.underscore
    end

    def to_h
      instance_values
    end
  end

  class Pinfo < Base
    attr_accessor :pointer_id, :type
    validates :pointer_id, presence: true
  end

  class Pos < Base
    attr_accessor :pointer_id, :x, :y
    validates :pointer_id, :x, :y, { presence: true }
  end

  class Poshide < Base
    attr_accessor :pointer_id
  end

  class Size < Base
    attr_accessor :size
    validates :size, presence: true, numericality: { in: 1..100 }
  end

  class Antialias < Base
    attr_accessor :antialias
    validates :antialias, presence: true
  end

  class Color < Base
    attr_accessor :r, :g, :b
    validates :r, :g, :b, presence: true, numericality: { in: 0..255 }
  end

  class Drawop < Base
    attr_accessor :drawop
    validates :drawop, presence: true
  end

  class Line < Base
    attr_accessor :p1, :p2
    validates :p1, :p2, presence: true
  end

  class Endstroke < Base
    attr_accessor :pointer_id
    validates :pointer_id, presence: true
  end
end
