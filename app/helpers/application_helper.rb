module ApplicationHelper
  def time_tag(datetime, relative: false, data: {}, **options)
    # time tags with datetime present are automatically localized to the user's
    # timezone via js Util.localizeDateTimes; data-is-relative determines whether
    # to replace the title or the content

    main = datetime
    sub = time_ago_in_words(datetime) + " ago"
    main, sub = sub, main if relative

    data[:is_relative] = true if relative

    tag.time(datetime: datetime.rfc3339, data: data, title: sub, **options) do
      main
    end
  end

  def svg_icon(name, class: nil, **options)
    cl = binding.local_variable_get :class
    tag.svg(class: "inline-block h-lh w-[1lh] #{cl}".strip, **options) do
      tag.use(fill: "currentColor", href: asset_path("icons.svg") + "##{name}")
    end
  end
end
