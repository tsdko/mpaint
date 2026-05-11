module ApplicationHelper
  def control_classes
    "bg-neutral-300 dark:bg-neutral-500 rounded-md"
  end

  def button_classes
    %w[
      hover:bg-neutral-200
      dark:hover:bg-neutral-400
      mt-2 mb-2 p-2
      text-center
    ].push(control_classes).join(" ")
  end

  def check_button_classes
    %w[
      has-checked:text-neutral-300
      dark:has-checked:text-neutral-600
      has-checked:bg-neutral-600
      dark:has-checked:bg-neutral-300
    ].push(button_classes).join(" ")
  end

  def error_bg_classes
    "bg-red-200 dark:bg-red-600"
  end

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

  def toast(content)
    tag.div(data: {controller: "close"}, class: "flex rounded-md p-2 m-2 #{error_bg_classes} w-xs") do
      concat(tag.div(class: "toastContent flex-1") do
        simple_format content
      end)
      concat(tag.a(href: "#", data: {action: "close#close:prevent"}) do
        svg_icon "xmark"
      end)
    end
  end

  def svg_icon(name, class: nil, **options)
    cl = binding.local_variable_get :class
    tag.svg(class: "inline-block h-lh w-[1lh] #{cl}".strip, **options) do
      tag.use(fill: "currentColor", href: asset_path("icons.svg") + "##{name}")
    end
  end
end
