source 'https://rubygems.org'

# Used to load .env file as environment variable when loading gemfile
begin
  File.read(".env").scan(/^([[A-Z0-9]|_]+)\=?(.*)?$/).each do |env_variable|
    ENV[env_variable[0]] = env_variable[1]
  end
rescue Errno::ENOENT
  
end

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '4.1.15'
ruby '2.2.0'


if ENV['OVH_MODE']
  gem 'capistrano', '3.6.0'
  gem 'capistrano-rails', group: :development
  gem 'capistrano-rvm', group: :development

  #Error tracking
  gem 'airbrake', '~> 5.0'
else
  gem 'newrelic_rpm'
end

# Use postgresql as the database for Active Record
gem 'pg'
# Use SCSS for stylesheets
gem 'sass-rails', '~> 4.0.3'
gem "compass-rails", "~> 1.1.2"

gem 'jquery-rails'
gem 'jquery-ui-rails'

gem 'unicorn'

gem 'uglifier', '>= 1.3.0'

gem "pusher"
gem "websocket-client-simple"

gem "mail", '2.6.3'

gem 'resque', "~> 1.26.0"

gem "stringex", :git => 'git://github.com/Fred-JulieDesk/stringex.git'
#gem "stringex", path: "../stringex"

gem 'whenever', :require => false

gem 'handlebars_assets'

gem "rack-timeout"
gem 'rack-cors', :require => 'rack/cors'

gem "redis"

gem "nokogiri"
gem "angularjs-rails"
# To use angular templates steamlessly
gem 'angular-rails-templates'


#gem "httpclient"
#gem "httpclient",    path: "../httpclient"
gem "http"
gem 'mixpanel-ruby'
gem 'simple_segment'

#gem "http", path: "../http"

group :production do
  gem 'lograge'
end

group :development do
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'railroady'
end

group :test, :development do
  # Allow to test easily Javascript, including Angular apps
  gem 'jasmine'
end

group :test do
  gem 'rspec-rails', '~> 3.0'
  gem 'factory_girl'
  gem 'database_cleaner'
  gem "webmock-rspec-helper"
  #Code test coverage tool https://github.com/colszowka/simplecov
  gem 'simplecov', :require => false
end

# We will load it manually in an initializer because we are using Rack::Deflater Middleware https://github.com/MiniProfiler/rack-mini-profiler#custom-middleware-ordering-required-if-using-rackdeflate-with-rails
gem 'rack-mini-profiler', require: false
gem 'flamegraph'
gem 'stackprof' # ruby 2.1+ only
gem 'memory_profiler'

#Color picker for rails
gem 'jquery-minicolors-rails'

# ALlow to make easy list presentation
gem "smart_listing"

# Allow to save Settings easily in DB
gem "rails-settings-cached"

# Expose the AWS SDK to ruby with a easy wrapper
gem 'aws-sdk', '~> 2'
