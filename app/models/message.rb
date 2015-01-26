class Message < ActiveRecord::Base

  belongs_to :messages_thread
  has_many :message_classifications
  has_many :julie_actions

  attr_writer :google_message

  def validate_message_classifications
    JulieAction.create_from_message self

  end


  def google_message
    @google_message ||= Gmail::Message.get self.google_message_id
  end

  def from_me?
    google_message.from.include? "julie@juliedesk.com"
  end

  def self.import_emails
    google_threads = Gmail::Label.inbox.threads

    MessagesThread.update_all(in_inbox: false)
    google_threads.map(&:detailed).each do |google_thread|
      messages_thread = MessagesThread.find_by_google_thread_id google_thread.id
      if messages_thread
        messages_thread.update_attribute :in_inbox, true
      else
        email = ApplicationHelper.strip_email google_thread.messages.first.from
        account_email = Account.find_account_email email

        messages_thread = MessagesThread.create google_thread_id: google_thread.id, in_inbox: true, account_email: account_email
      end

      google_thread.messages.each do |google_message|
        message = Message.find_by_google_message_id google_message.id

        unless message
          messages_thread.messages.create google_message_id: google_message.id, received_at: DateTime.parse(google_message.date)
        end
      end
    end

    nil
  end



end