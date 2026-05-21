require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "downcases and strips email_address" do
    user = User.new(email_address: " DOWNCASED@EXAMPLE.COM ")
    assert_equal("downcased@example.com", user.email_address)
  end

  test "doesn't allow anonymous display name" do
    user = users(:one).dup
    user.display_name = User.anonymous.display_name
    assert_not user.valid?
  end

  test "doesn't allow fallback display name" do
    user = users(:one).dup
    user.display_name = "user #123"
    assert_not user.valid?
  end

  test 'allows display_name not starting with "user #"' do
    user = users(:one).dup
    user.display_name = "user123"
    assert user.valid?
  end

  test "doesn't allow display_name longer than #{User::MAX_NAME_LENGTH} characters" do
    user = users(:one).dup
    user.display_name = "a" * (User::MAX_NAME_LENGTH + 1)
    assert_not user.valid?
  end

  test "allows display_name of exactly #{User::MAX_NAME_LENGTH} characters" do
    user = users(:one).dup
    user.display_name = "a" * User::MAX_NAME_LENGTH
    assert user.valid?
  end

  test "doesn't allow display_name prefixed with an ASCII number" do
    user = users(:one).dup
    user.display_name = "1stUser"
    assert_not user.valid?
  end

  test "allows display_name prefixed with a non-ASCII number" do
    user = users(:one).dup
    user.display_name = "①stUser"
    assert user.valid?
  end
end
