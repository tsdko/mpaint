class RemoveNestingFromLineStrokes < ActiveRecord::Migration[8.1]
  class Image::Stroke < ApplicationRecord; end

  def change
    reversible do |direction|
      # this is likely slower than doing it directly via db sql (possible in sqlite and postgres at least)
      Image::Stroke.all.each do |stroke|
        stroke.data.each_index do |i|
          d = stroke.data[i]
          next if d.empty? or d[0] != "l"
          direction.up   { stroke.data[i] = [d[0], *d[1]] }
          direction.down { stroke.data[i] = [d[0], d[1..]] }
        end
        stroke.save!
      end
    end
  end
end
