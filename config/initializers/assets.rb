# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.

Rails.application.config.assets.precompile += %w( stats.css dashboard.css operators/sources.css)
Rails.application.config.assets.precompile += %w( stats.js test.js dashboard.js angular_attendees_app.js angular_dependencies.js angular_virtual_meetings_helper_app.js thread_messages/actions.js operators/sources.js angular_reply_box_app.js angular_AI_manager_app.js )
