module CanvasCommand
  # Commands clients can send during drawing.
  # See also Image::Stroke for the stored equivalents.

  class Pinfo
    include ActiveModel::Model

    attr_accessor :pointer_id, :type
    validates :pointer_id, presence: true
  end

  class Pos
    include ActiveModel::Model

    attr_accessor :pointer_id, :x, :y
    validates :pointer_id, :x, :y, { presence: true }
  end

  class Poshide
    include ActiveModel::Model

    attr_accessor :pointer_id
  end

  class Size
    include ActiveModel::Model

    attr_accessor :size
    validates :size, presence: true, numericality: { in: 1..100 }
  end

  class Antialias
    include ActiveModel::Model

    attr_accessor :antialias
    validates :antialias, presence: true
  end

  class Color
    include ActiveModel::Model

    attr_accessor :r, :g, :b
    validates :r, :g, :b, presence: true, numericality: { in: 0..255 }
  end

  class Drawop
    include ActiveModel::Model

    attr_accessor :drawop
    validates :drawop, presence: true
  end

  class Line
    include ActiveModel::Model

    attr_accessor :p1, :p2
    validates :p1, :p2, presence: true
  end

  class Endstroke
    include ActiveModel::Model

    attr_accessor :pointer_id
    validates :pointer_id, presence: true
  end
end
