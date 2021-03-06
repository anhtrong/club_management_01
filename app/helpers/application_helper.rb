module ApplicationHelper
  def devise_error_messages!
    resource.errors.full_messages.map { |msg| content_tag(:li, msg) }.join
  end

  def resource_name
    :user
  end

  def resource
    @resource ||= User.new
  end

  def devise_mapping
    @devise_mapping ||= Devise.mappings[:user]
  end

  def index_continue object, index, per_page
    (object.to_i - 1) * per_page.to_i + index + 1
  end

  def flash_error object
    flash[:danger] = object.errors.full_messages
  end

  def manager_of_club user
    @user_clubs = user.user_clubs.manager
  end

  def image_holder album
    album.images.first.url
  end

  def status_user_club user, club
    user_club = user.user_clubs.find_by club_id: club.id
    user_club.present? ? user_club.joined? : nil
  end

  def count_request variable
    variable.club.user_clubs.unactive.count
  end
end
