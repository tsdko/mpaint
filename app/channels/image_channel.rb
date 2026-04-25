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
    # (ideally identify by connection not user so multiple conns from same user still broadcast fine)
    # TODO: include some sort of conn id in data as well,
    # right now we can't distinguish multiple user connections from the client either
    ImageChannel.broadcast_to(@image, data.merge({user_id: current_user.id}))
  end
end
