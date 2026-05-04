module CanvasCommand
  # Commands clients can send during drawing.
  # See also Image::Stroke for the stored equivalents.

  def self.from_h(data)
    ind_data = data.with_indifferent_access
    ct = ind_data[:t].camelize
    CanvasCommand.const_get(ct).new(**ind_data.except(:t))
  end

  def self.all
    self.constants.map do |cn|
      self.const_get cn
    end.select do |c|
      c.is_a? Class and c < Base
    end
  end

  class Base
    include ActiveModel::Model

    # optional methods for storage:
    # self.stored_header -> String
    #   short identifier for the command, must be unique
    # self.stored_fields -> Array
    #   an array of fields (of the result of calling .to_h on this object)
    #   determines which fields are stored and in which order
    #   can do nested fields via arrays, e.g. a[:b][:c] -> [:b, :c]

    def self.cmd_type
      name.demodulize.underscore
    end

    def initialize(*args, **kwargs)
      super(*args, **kwargs)
      validate!
    end

    # true if this command affects state of other drawing commands
    # (e.g. modifies brush size or color)
    def stateful?
      false
    end

    # true if this command should be broadcasted once received by the server
    def broadcast?
      true
    end

    def to_h
      instance_values
        .merge({t: self.class.cmd_type})
        .except("context_for_validation", "errors")
    end
  end

  class Pinfo < Base
    attr_accessor :pointer_id, :type
    validates :pointer_id, presence: true, exclusion: { in: [nil] }
  end

  class Pos < Base
    attr_accessor :pointer_id, :x, :y
    validates :pointer_id, :x, :y, { presence: true, exclusion: { in: [nil] } }
  end

  class Poshide < Base
    attr_accessor :pointer_id
  end

  class Size < Base
    attr_accessor :size
    validates :size, presence: true, exclusion: { in: [nil] }, numericality: { in: 1..100 }

    def stateful?
      true
    end

    def self.stored_header
      "sz"
    end

    def self.stored_fields
      [:size]
    end
  end

  class Antialias < Base
    attr_accessor :antialias
    validates :antialias, presence: true

    def stateful?
      true
    end

    def self.stored_header
      "aal"
    end

    def self.stored_fields
      [:antialias]
    end
  end

  class Color < Base
    attr_accessor :r, :g, :b
    validates :r, :g, :b, presence: true, exclusion: { in: [nil] }, numericality: { in: 0..255 }

    def stateful?
      true
    end

    def self.stored_header
      "cl"
    end

    def self.stored_fields
      [:r, :g, :b]
    end
  end

  class Drawop < Base
    attr_accessor :drawop
    validates :drawop, presence: true, exclusion: { in: [nil] }

    def stateful?
      true
    end

    def self.stored_header
      "op"
    end

    def self.stored_fields
      [:drawop]
    end
  end

  class Line < Base
    attr_accessor :p1, :p2, :pointer_id
    validates :p1, :p2, :pointer_id, presence: true, exclusion: { in: [nil] }

    def self.stored_header
      "l"
    end

    def self.stored_fields
      # XXX this still feels quite inefficient, p1/p2 coordinates are usually very close to each other
      #     which means they could probably be delta'd at the very least
      #     (maybe even previous p2 with current p1?)
      [[:p1, :x], [:p1, :y], [:p2, :x], [:p2, :y]]
    end
  end

  class Endstroke < Base
    attr_accessor :pointer_id
    validates :pointer_id, presence: true, exclusion: { in: [nil] }

    def broadcast?
      false
    end
  end
end
