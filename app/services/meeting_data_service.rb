class MeetingDataService

  def initialize(messages_thread)
    @messages_thread = messages_thread
    @messages_thread.re_import
  end

  def should_ask_location?(julie_action)
    message_classification = julie_action.message_classification

    required_data_flow = AutomaticProcessing::Flows::JulieActionRequiredDataForLocation.new(
        classification: julie_action.message_classification,
        account: @messages_thread.account
    )

    required_data = required_data_flow.process_flow(julie_action.action_nature)
    return false if required_data.blank?

    missing_data = required_data.select do |required_field|
      required_field[:required_from] = :classification if [:any_source].include?(required_field[:required_from])
      message_classification.missing_field?(required_field[:field], { scope: required_field[:required_from] })
    end

    missing_data.any?
  end


  def missing_contact_info(julie_action)
    AutomaticProcessing::Flows::JulieActionComplementaryInfo.new(
      classification: julie_action.message_classification,
      account:        @messages_thread.account,
    ).process_flow(julie_action.action_nature).try(:[], :field)
  end

  def initial_recipients(julie_action)
    message_classification = julie_action.message_classification
    message = @messages_thread.messages.find { |m| m.id = message_classification.message_id }
    messages_thread_contacts = MessagesThread.contacts({server_messages_to_look: [message.server_message]}).map { |c| c[:email].try(:downcase) }
    message.initial_recipients({ contact_emails: messages_thread_contacts, present_attendees: message_classification.get_present_attendees.map(&:to_h) })
  end

  def initial_recipients_to(julie_action)
    recipients = initial_recipients(julie_action)
    return nil if recipients.nil?
    recipients[:to]
  end

  def recipients_names(julie_action)
    recipients = self.initial_recipients_to(julie_action)
    message_classification = julie_action.message_classification
    recipients.map { |email| message_classification.get_present_attendee_by_email(email) }.compact.map { |attendee| attendee.usage_name || attendee.full_name }
  end


  def generate_event_data(julie_action)
    message_classification = julie_action.message_classification
    start_date = DateTime.parse(message_classification.verified_dates_by_ai['verified_dates'].first)
    end_date = start_date + message_classification.duration.minutes
    timezone = message_classification.verified_dates_by_ai['timezone']

    {
        email: @messages_thread.account.email,
        summary: message_classification.summary,
        description: message_classification.notes,
        attendees: message_classification.get_present_attendees.map(&:to_h),
        location: message_classification.location,
        all_day: false,
        private: false,
        start: start_date.strftime("%FT%T%:z"),
        end: end_date.strftime("%FT%T%:z"),
        start_timezone: timezone,
        end_timezone: timezone,
        calendar_login_username: @messages_thread.account.email #Warning, here it could be different for clients with calendar rules
    }
  end

end