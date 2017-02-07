module LinkedAttendees
  class Manager

    attr_reader :messages_thread, :accounts_cache

    FETCH_URL = ENV['JULIEDESK_APP_BASE_PATH'] + '/api/v1/linked_attendees/extract'

    def initialize(messages_thread, accounts_cache)
      @messages_thread = messages_thread
      @accounts_cache = accounts_cache
    end

    def fetch
      fetch_call
    end

    private

    def fetch_call
      client = HTTP.auth(ENV['JULIEDESK_APP_API_KEY'])

      # Separate clients from non clients in a beautiful and magnificent way
      recipients = @messages_thread.computed_recipients.partition {|r_email| Account.find_account_email(r_email, {accounts_cache: @accounts_cache}).present?}
      #clients_recipients = recipients[0].map{|client_recipient| Account.find_account_email(client_recipient, {accounts_cache: @accounts_cache})}
      clients_recipients = [@messages_thread.account_email]

      result = {}
      if recipients[1].present? # Don't call if no other attendees than clients
        # We send the main emails of the clients (in case these were aliases)
        response = client.post(FETCH_URL, json: {clients_emails: clients_recipients, attendees_emails: recipients[1]})
        if response.code == 200
          result = response.parse
        end
      end

      result
    end
  end
end