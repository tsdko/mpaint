module ImagesHelper
  def canvas_control_classes
    "inline-block md:block min-w-[2lh]"
  end

  def canvas_tool_button(name, icon: "pencil", **options)
    tag.label(class: "#{check_button_classes} #{canvas_control_classes}") do
      concat tag.input(class: "hidden", name: "tool", type: "radio", value: name, data: {action: "canvas-tool#update"}, **options)
      concat svg_icon icon
    end
  end
end
