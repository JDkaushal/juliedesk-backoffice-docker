class MessagesThreadsController < ApplicationController

  layout 'inbox.vue', only: :index
  include ProfilerHelper

  before_action :only_admin, only: [:history]

  before_action :check_staging_mode

  def index
    @operator_greetings_stats = Operator.find(session[:operator_id]).daily_stats
    render_messages_threads
  end

  # Display only thread handled by the ai (handled_by_ai set to true)
  # def index_for_ai
  #   render_messages_threads_ai
  # end

  def search
    @messages_thread = MessagesThread.where(server_thread_id: params[:server_thread_ids]).includes(messages: {message_classifications: :julie_action}).sort_by{|mt|
      mt.messages.select{|m| !m.archived}.map{|m| m.received_at}.min ||
          mt.messages.map{|m| m.received_at}.max ||
          DateTime.parse("2500-01-01")
    }.reverse
    accounts_cache = Account.accounts_cache(mode: "light")
    @messages_thread.each{|mt| mt.account(accounts_cache: accounts_cache)}


    data = @messages_thread.as_json(include: [:messages], methods: [:received_at, :account, :computed_data, :event_data, :current_status])
    render json: {
        status: "success",
        message: "",
        data: data
    }
  end

  def set_to_be_merged
    @messages_thread = MessagesThread.find(params[:id])

    operator_id = if params[:to_merge]
                    session[:operator_id]
                  else
                    nil
                  end

    @messages_thread.update(to_be_merged: params[:to_merge], to_be_merged_operator_id: operator_id)

    redirect_to messages_threads_path
  end

  def index_with_import
    ImportEmailsWorker.enqueue
    #Message.import_emails
    render_messages_threads
  end

  def index_with_import_ai
    Message.import_emails
    render_messages_threads_ai
  end

  def history
    @messages_thread = MessagesThread.includes(messages: {message_classifications: :julie_action}, operator_actions_groups: {operator_actions: {}, operator: {}}, mt_operator_actions: {operator: {}}).find(params[:id])

    @messages_thread.account
  end

  def show
    begin
      @messages_thread = MessagesThread.includes(messages: {message_interpretations: {}, message_classifications: :julie_action}, operator_actions_groups: {operator_actions: {}, operator: {}}).find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render status: :not_found, text: 'Sorry, this thread does not exist.'
      return
    end

    @messages_thread.re_import
    if @messages_thread.messages.size == 0
      render status: :not_found, text: 'Sorry, this thread has no messages.'
      return
    end

    OperatorAction.create_and_verify({
                                         initiated_at: DateTime.now,
                                         target: @messages_thread,
                                         nature: OperatorAction::NATURE_OPEN,
                                         operator_id: session[:operator_id],
                                         messages_thread_id: @messages_thread.id
                                     })

    @accounts_cache_light = Account.accounts_cache(mode: "light")
    julie_aliases = JulieAlias.all
    @julie_emails = julie_aliases.map(&:email).map(&:downcase)
    @client_emails = @accounts_cache_light.select { |_, account| account['subscribed'] && account['configured'] }.map{|_, account| [account['email']] + account['email_aliases']}.flatten

    # Fresh Thread == Thread not yet classified
    @fresh_thread = @messages_thread.computed_data[:appointment_nature].blank?

    # If the thread is not associated with a client, we will try to associate it
    if @messages_thread.account_email.blank?
      account_association_data_holder = ThreadAccountAssociation::DataHolder.new(@accounts_cache_light, julie_aliases, @julie_emails)

      ThreadAccountAssociation::Manager.new(
          data_holder: account_association_data_holder,
          messages_thread: @messages_thread,
          server_thread: @messages_thread.server_thread
      ).compute_association_v2
    end

    @messages_thread.account

    @messages_thread.create_event_title_review_if_needed

    #JSON.parse(REDIS_FOR_ACCOUNTS_CACHE.get('gregoire.lopez@tactill.com') || "{}")

    render :show
    #render nothing: true
  end

  def archive

    messages_thread = MessagesThread.includes(messages: {message_classifications: :julie_action}).find(params[:id])
    messages = messages_thread.messages

    last_email_status = messages_thread.last_email_status({messages: messages})

    if last_email_status == "from_me"
      last_message_classification = messages_thread.last_message_classification
      last_message_classification.update_attribute :thread_status, params[:thread_status]
    elsif last_email_status == "from_me_free_reply"
      last_message_classification = messages_thread.last_message_classification
      last_message_classification.update_attribute :thread_status, params[:thread_status]
    else
      last_message = messages.sort_by(&:updated_at).last
      message_classification = last_message.message_classifications.create_from_params classification: MessageClassification::NOTHING_TO_DO, operator: session[:user_username], thread_status: params[:thread_status]
      message_classification.julie_action.update_attribute :done, true
    end

    OperatorAction.create_and_verify({
                                         initiated_at: DateTime.now,
                                         target: messages_thread,
                                         nature: OperatorAction::NATURE_ARCHIVE,
                                         sub_nature: params[:thread_status],
                                         operator_id: session[:operator_id],
                                         messages_thread_id: messages_thread.id
                                     })

    should_update_reminder_date = params[:follow_up_reminder_enabled].present?

    # Voir pertinence à ce moment, on le fait sur l'index déjà normalement

    refreshed_messages = messages_thread.server_thread(force_refresh: true)['messages'].select { |m| !m['duplicate'] }

    if params[:current_messages_ids].present?
      current_messages_ids = params[:current_messages_ids].split(',')
      refreshed_messages_ids = refreshed_messages.map{|m| m['id'].to_s }

      missing_messages_ids = refreshed_messages_ids - current_messages_ids
    end

    # Check if number of message has growth in the meantime (which would mean that we received a new message)
    if missing_messages_ids && missing_messages_ids.size > 0
      #if messages_thread.server_thread(force_refresh: true)['messages'].find{|m| m['read']}.present?
      #if messages_thread.server_thread(force_refresh: true)['messages'].map{|m| m['read']}.select{|read| !read}.length > 0
      # We should not have to do that now, because we only archive it when no unread messages are present
      # EmailServer.unarchive_thread(messages_thread_id: messages_thread.server_thread_id)

      if should_update_reminder_date
        messages_thread.update(follow_up_reminder_date: params[:follow_up_reminder_date])
      end
      # We redirect the operator to the current thread show action, so he can continue to work on the thread
      # And we scroll to the bottom of the page to show the new message to the operator
      redirect_to messages_thread_path(messages_thread, scroll_to_bottom: true, not_read_messages: missing_messages_ids)
    else

      EmailServer.archive_thread(messages_thread_id: messages_thread.server_thread_id)

      messages.update_all(archived: true)

      data = {
          should_follow_up: false,
          status: params[:thread_status],
          in_inbox: false
      }

      if should_update_reminder_date
        data.merge!(follow_up_reminder_date: params[:follow_up_reminder_date])
      end

      if data[:status] == MessageClassification::THREAD_STATUS_SCHEDULING_ABORTED
        data[:aborted_at] = DateTime.now
      end

      messages_thread.update(data)
      messages_thread.remove_tag(MessagesThread::SYNCING_TAG)

      WebSockets::Manager.trigger_archive(messages_thread.id)

      client_request_created = ClientRequest.create_if_needed(messages_thread)

      if client_request_created
        ClientSuccessTrackingHelpers.async_track_new_request_sent(messages_thread.id)
      end

      # if ENV['PUSHER_APP_ID']
      #   Pusher.trigger('private-global-chat', 'archive', {
      #       :message => 'archive',
      #       :message_thread_id => messages_thread.id
      #   })
      # elsif ENV['RED_SOCK_URL']
      #   RedSock.trigger "private-global-chat", 'archive', {
      #                                            message: "archive",
      #                                            :message_thread_id => messages_thread.id
      #                                        }
      # end

      # When the thread is archived we can redirect the operator to the threads list
      redirect_to action: :index
    end
  end

  def split
      messages_thread = MessagesThread.find(params[:id])
      messages_ids = (params[:message_ids] || []).map(&:to_i)
      messages_thread.split(messages_ids)
      render json: { status: "success", message: "", data: {} }

    rescue ActiveRecord::RecordNotFound => e
      render json: { error_code: 'MESSAGES_THREAD:NOT_FOUND', message: "Thread with id #{params[:id]} does not exist" }, status: :not_found
    rescue MessagesThread::SplitError => e
      render json: { error_code: 'MESSAGES_THREAD:SPLIT_ERROR', message: e.message }, status: :unprocessable_entity
  end

  def associate_to_account
    messages_thread = MessagesThread.find(params[:id])
    account = Account.create_from_email(params[:account_email])
    if account
      messages_thread.update_attributes({
       account_email: account.email,
       account_name: account.usage_name,
       account_association_merging_possible: false
                                        })

      render json: {
          status: "success",
          data: {}
      }
    else
      render json: {
          status: "error",
          message: "No such account"
      }
    end
  end

  def remove_event_link
    messages_thread = MessagesThread.find(params[:id])
    event_id = params[:event_id]

    current_scheduling_status = messages_thread.scheduling_status

    # WHen events has been created directly (not using an ask_availabilities flow) we need to remove them from the 'events' array of the julie action when we want to remove the link with the thread
    if current_scheduling_status == MessagesThread::EVENTS_CREATED
      created_events_julie_action = messages_thread.created_events_julie_action

      if created_events_julie_action.present?
        events = JSON.parse(created_events_julie_action.events)
        events = events.reject!{|e| e['id'] == event_id}
        created_events_julie_action.update(events: events.to_json)
      end
    else
      message_classification_params = {}
      last_message_classification = messages_thread.messages.map{|m|
        m.message_classifications
      }.flatten.sort_by(&:updated_at).select(&:has_data?).compact.last
      message = messages_thread.messages.last

      if last_message_classification
        message_classification_params = last_message_classification.attributes.symbolize_keys.select{|k, v| [:appointment_nature, :summary, :duration, :location, :attendees, :notes, :constraints, :date_times, :locale, :timezone, :location_nature, :private, :other_notes, :constraints_data, :number_to_call].include? k}
      end


      mc = message.message_classifications.create message_classification_params.merge(classification: MessageClassification::ASK_CANCEL_APPOINTMENT, operator: session[:user_username], processed_in: 0)
      mc.append_julie_action
      mc.julie_action.update_attributes({
                                            done: true,
                                            deleted_event: true,
                                            processed_in: 0,
                                            event_id: last_message_classification.try(:julie_action).try(:event_id)
                                        })
    end

    redirect_to messages_thread
  end

  def unlock
    messages_thread = MessagesThread.find(params[:id])
    messages_thread.update_attribute :locked_by_operator_id, nil

    WebSockets::Manager.trigger_locks_changed
    # if ENV['PUSHER_APP_ID']
    #   Pusher.trigger('private-global-chat', 'locks-changed', {
    #       :message => 'locks_changed',
    #       :locks_statuses => MessagesThread.get_locks_statuses_hash
    #   })
    # elsif ENV['RED_SOCK_URL']
    #   RedSock.trigger 'private-global-chat', 'locks-changed', {
    #                                            :message => 'locks_changed',
    #                                            :locks_statuses => MessagesThread.get_locks_statuses_hash
    #                                        }
    # end

    redirect_to messages_thread
  end

  def preview
    @messages_thread = MessagesThread.includes(messages: {message_classifications: :julie_action}, operator_actions_groups: {operator_actions: {}, operator: {}}).find(params[:id])

    if @messages_thread.messages.size == 0
      render status: :not_found, text: 'Sorry, this thread has no messages.'
      return
    end

    OperatorAction.create_and_verify({
                                         initiated_at: DateTime.now,
        target: @messages_thread,
        nature: OperatorAction::NATURE_OPEN,
        operator_id: session[:operator_id],
        messages_thread_id: @messages_thread.id
    })
    @messages_thread.re_import
    @messages_thread.account

    @accounts_cache_light = Account.accounts_cache(mode: "light")
    @julie_emails = JulieAlias.all.map(&:email).map(&:downcase)
    @client_emails = @accounts_cache_light.select { |_, account| account['subscribed'] && account['configured'] }.map{|_, account| [account['email']] + account['email_aliases']}.flatten

    render action: :preview, layout: "review"
  end

  def remove_data
    messages_thread = MessagesThread.find params[:id]
    messages_thread.re_import

    if messages_thread.messages.empty?
      messages_thread.operator_actions_groups.destroy_all
      messages_thread.mt_operator_actions.destroy_all
      # We reset the eventual auto matic follow up date, so it doesn't trigger in the future
      # We also
      messages_thread.update_attributes(
          was_merged: true,
          follow_up_reminder_date: nil,
          in_inbox: false
      )

      WebSockets::Manager.trigger_archive(messages_thread.id)
    end

    # We need to recompute the allowed attendees after merging the messages in the messages_thread
    merged_in_thread = MessagesThread.find(params[:merged_in_thread_id])
    if merged_in_thread.present?
      merged_in_thread.recompute_allowed_attendees_full
    end

    render json: { status: "success", data: {} }
  end

  private

  # def render_messages_threads_ai
  #   respond_to do |format|
  #     format.html {
  #     }
  #     format.json {
  #       @messages_thread = MessagesThread.where("handled_by_ai = TRUE").includes(messages: {}, locked_by_operator: {}).sort_by{|mt|
  #         mt.messages.select{|m| !m.archived}.map{|m| m.received_at}.min ||
  #             mt.messages.map{|m| m.received_at}.max ||
  #             DateTime.parse("2500-01-01")
  #       }
  #
  #       @messages_thread.reverse!
  #
  #       accounts_cache = Account.accounts_cache(mode: "light")
  #       @messages_thread.each{|mt| mt.account(accounts_cache: accounts_cache, messages_threads_from_today: @messages_threads_from_today, skip_contacts_from_company: true)}
  #
  #       data = @messages_thread.as_json(include: :messages, methods: [:received_at, :account, :locked_by_operator_name], only: [:id, :locked_by_operator_id, :should_follow_up, :subject, :snippet, :sent_to_admin, :delegated_to_support, :server_thread_id, :last_operator_id, :status, :event_booked_date, :account_email, :to_be_merged])
  #
  #       render json: {
  #                  status: "success",
  #                  message: "",
  #                  data: data
  #              }
  #     }
  #
  #
  #   end
  # end

  def render_messages_threads
    respond_to do |format|
      format.html {
        render "index.vue.html.erb"
      }
      format.json {
        now = Time.now

        @operators_on_planning = Operator.select('operators.id, operators.name, operators.color').joins(:operator_presences).where('operator_presences.date >= ? AND operator_presences.date <= ?', now.beginning_of_hour, now.end_of_hour)
        @messages_threads_from_today = MessagesThread.distinct.where('date(created_at) = ?', now.to_date).group('account_email').count

        @messages_thread = MessagesThread.where("(in_inbox = TRUE OR should_follow_up = TRUE) AND handled_by_ai = FALSE AND handled_by_automation = FALSE").includes(locked_by_operator: {}, messages: :message_classifications).select { |mt| mt.messages.length > 0 }.sort_by { |mt| mt.find_or_compute_thread_dates }

        accounts_cache = Account.accounts_cache(mode: "light")
        users_access_lost_cache = MessagesThread.users_with_threads_blocked
        malfunctionning_julie_aliases_cache = REDIS_FOR_ACCOUNTS_CACHE.smembers('malfunctionning_julie_aliases')

        # Allow to easily check if an email is attached to a client (main email or email alias)
        all_clients_emails = accounts_cache.map{|acc| acc[1]['email_aliases'] + [ acc[1]['email']]}.flatten

        @messages_thread.each do |mt|
          mt.check_if_blocked(users_access_lost_cache, all_clients_emails)
          mt.check_if_julie_alias_malfunctionning(malfunctionning_julie_aliases_cache)
          mt.account(accounts_cache: accounts_cache, users_access_lost_cache: users_access_lost_cache, messages_threads_from_today: @messages_threads_from_today, skip_contacts_from_company: true)
          if mt.account.present?
            mt.check_if_owner_inactive
          end
        end

        MessagesThread.filter_on_privileges(session[:privilege], @messages_thread)

        data = @messages_thread.as_json(methods: [:account, :locked_by_operator_name, :thread_blocked, :can_be_processed_now, :julie_aliases_malfunctionning],
                                        only: [:id, :request_date, :messages_count, :locked_by_operator_id, :in_inbox, :should_follow_up, :subject, :snippet, :sent_to_admin, :delegated_to_support, :server_thread_id, :last_operator_id, :status, :event_booked_date, :account_email, :to_be_merged, :is_multi_clients, :tags])
        operators_data = @operators_on_planning.as_json

        render json: {
            status: "success",
            message: "",
            data: data,
            operators_data: operators_data,
            current_operator: Operator.find(session[:operator_id]).as_json(only: [:id, :name, :email, :privilege], methods: [:daily_stats, :requests_to_learn_count]),
            date: Time.now.to_i
        }
      }
    end
  end
end
