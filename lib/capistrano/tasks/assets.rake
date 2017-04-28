# lib/capistrano/tasks/assets.rake
#
# Override of assets compilation to leverage compilation on the deployer
# This task is compatible with "classic" parallel deployment and sequential deployment


# Remove actual precompile task
Rake::Task['deploy:assets:precompile'].clear

namespace :deploy do
  namespace :assets do
    desc 'Precompile assets locally and then rsync to remote servers'
    
    # Local precompile tasks
    # Called directly in sequential mode
    task :local_precompile do
      
      run_locally do
        with rails_env: fetch(:rails_env), rails_groups: fetch(:rails_assets_groups) do
          
          execute :rake, "assets:precompile" 
     
          roles(fetch(:assets_roles)).each do |server|
            execute "rsync -av ./public/assets/ #{server.user}@#{server.hostname}:#{release_path}/public/assets/"
          end
      
          # Remove assets on deployer
          execute :rake, "assets:clobber"
        end
      end
    end
    
    if (ENV['deploy_sequence']).nil?
      # Override Standard Deploy Case
      task :precompile do
        invoke 'deploy:assets:local_precompile'
      end
    end
  end
end