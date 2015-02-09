class MessagesThreadsController < ApplicationController

  def index
    @messages_thread = MessagesThread.where(in_inbox: true).includes(messages: :message_classifications).sort_by{|mt| mt.messages.map{|m| m.received_at}.max}.reverse
    respond_to do |format|
      format.html {

      }
      format.json {
        render json: {
            status: "success",
            message: "",
            data: @messages_thread.as_json(include: [:messages], methods: [:received_at])
        }
      }
    end
  end

  def index_with_import
    Message.import_emails
    respond_to do |format|
      format.html {
        redirect_to action: :index
      }
      format.json {
        render json: {
          status: "success",
          message: "",
          data: MessagesThread.where(in_inbox: true).includes(messages: :message_classifications).sort_by{|mt| mt.messages.map{|m| m.received_at}.max}.reverse.as_json(include: [:messages], methods: [:received_at])
        }
      }
    end

  end

  def show
    @messages_thread = MessagesThread.includes(messages: :message_classifications).find(params[:id])
    @messages_thread.re_import
  end

  def archive
    messages_thread = MessagesThread.find(params[:id])
    messages_thread.google_thread.archive
    Message.where(messages_thread_id: messages_thread.id).update_all(archived: true)

    if messages_thread.google_thread(force_refresh: true).messages.map(&:unread?).select(&:present?).length > 0
      messages_thread.google_thread.unarchive
    else
      messages_thread.update_attribute(:in_inbox, false)
    end

    redirect_to action: :index
  end

  def split
    messages_thread = MessagesThread.find(params[:id])
    messages_thread.split(params[:message_ids].map(&:to_i))
    render json: {
        status: "success",
        message: "",
        data: {

        }
    }
  end

end
