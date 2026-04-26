class ImageChannel < ApplicationCable::Channel
  def subscribed
    @image = Image.find(params[:id])
    stream_for @image
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def pos(data)
    # TODO: avoid self-broadcasting if possible, or at least ignore clientside
    ImageChannel.broadcast_to(@image, data.merge({user_id: connection.connection_identifier()}))
  end

  def poshide(data)
    # TODO: avoid self-broadcasting if possible, or at least ignore clientside
    ImageChannel.broadcast_to(@image, data.merge({user_id: connection.connection_identifier()}))
  end

  def color(data)
    # TODO: avoid self-broadcasting if possible, or at least ignore clientside
    ImageChannel.broadcast_to(@image, data.merge({user_id: connection.connection_identifier()}))
  end

  def line(data)
    # TODO: avoid self-broadcasting if possible, or at least ignore clientside
    ImageChannel.broadcast_to(@image, data.merge({user_id: connection.connection_identifier()}))
  end
end
