module ApplicationHelper
  def svg_icon(name, class: nil, **options)
    cl = binding.local_variable_get :class
    tag.svg(class: "inline-block h-lh w-[1lh] #{cl}".strip, **options) do
      tag.use(fill: "currentColor", href: asset_path("icons.svg") + "##{name}")
    end
  end
end
