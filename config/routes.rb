Rails.application.routes.draw do
  resource :session
  resources :passwords, param: :token
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  root "images#index", is_editable: true

  resources :image_strokes, only: [:index]

  resources :images, only: [:new, :create, :index, :show, :edit] do
    resources :image_participations, path: "participations", only: [:index]
    resources :image_strokes, path: "strokes", only: [:index]
  end
  resources :messages, only: [:index, :show, :edit, :create, :update]
  resources :users, only: [:show, :edit]

  match "/404", :to => "errors#not_found", :via => :all
  match "/500", :to => "errors#internal_server_error", :via => :all
end
