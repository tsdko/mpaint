class ApplicationFormBuilder < ActionView::Helpers::FormBuilder
  def initialize(*args)
    super(*args)
    options.merge!(class: "grid grid-cols-[auto_1fr] max-w-sm")
  end

  def text_field(attribute, options = {})
    super(attribute, options.merge(class: TEXT_INPUT_CLASSES))
  end

  def number_field(attribute, options = {})
    super(attribute, options.merge(class: TEXT_INPUT_CLASSES))
  end

  def email_field(attribute, options = {})
    super(attribute, options.merge(class: TEXT_INPUT_CLASSES))
  end

  def password_field(attribute, options = {})
    super(attribute, options.merge(class: TEXT_INPUT_CLASSES))
  end

  def textarea(attribute, options = {})
    super(attribute, options.merge(class: TEXT_INPUT_CLASSES))
  end

  def submit(value = nil, options = {})
    super(value, options.merge(class: "col-span-full bg-accent-500 hover:bg-accent-400 hover:cursor-pointer rounded ps-2 pe-2 pt-1 pb-1"))
  end

  private
    TEXT_INPUT_CLASSES = "rounded border-1 ps-1 pe-1 border-neutral-300"
end
