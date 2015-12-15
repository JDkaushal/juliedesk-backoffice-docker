class Api::V1::MessagesThreadsController < Api::ApiV1Controller

  def inbox_count
    messages_threads = MessagesThread.where(in_inbox: true)
    accounts_cache = Account.accounts_cache(mode: "light")
    messages_threads.each{|mt| mt.account(accounts_cache: accounts_cache)}


    messages_threads = messages_threads.select do |mt|
      if mt.account && mt.account.company_hash
        working_hours = mt.account.company_hash['working_hours']
        timezone = mt.account.company_hash['timezone']
        now = DateTime.now.in_time_zone(timezone)
        day = now.strftime("%a").downcase
        if working_hours[day]
          working_hours[day].select do |k, wh|
            hstart = wh[0].to_i
            hend = wh[1].to_i

            dstart = DateTime.now.in_time_zone(timezone).change({ hour: hstart/100, min: hstart%100, sec: 0 })
            dend = DateTime.now.in_time_zone(timezone).change({ hour: hend/100, min: hend%100, sec: 0 })
            now >= dstart && now <= dend
          end.length > 0
        else
          false
        end
      else
        true
      end
    end

    inbox_messages_threads = messages_threads.select{ |mt|
      !mt.delegated_to_founders &&
          mt.account &&
          !mt.account.only_admin_can_process
    }

    admin_messages_threads = messages_threads.select{ |mt|
      mt.delegated_to_founders ||
          !mt.account ||
          mt.account.only_admin_can_process
    }

    render json: {
        status: "success",
        data: {
            count: inbox_messages_threads.length,
            admin_count: admin_messages_threads.length
        }
    }
  end

  def weekly_recap_data
    account_email = params[:email]
    unless account_email.present?
      render json: {
          status: "error",
          message: "missing required param email",
          data: {}
      }
      return
    end

    render json: {
        status: "success",
        data: {
            results: [
                {
                    status: "scheduled",
                    subject: "Call Alexandro Gonzales <> Julie Desk [Julien Hobeika]",
                    other: {
                        date: "20151118T130000"
                    }
                },
                {
                    status: "scheduled",
                    subject: "Déjeuner Matthieu | L’Oréal | Julie Desk",
                    other: {
                        date: "20150412T123000"
                    }
                },
                {
                    status: "scheduling",
                    subject: "Mtg avec Angel Kulk",
                    other: {
                        waiting_for: "contact",
                        valid_suggestions_count: 4,
                        suggestions_count: 4
                    }
                },
                {
                    status: "scheduling",
                    subject: "Call avec Diego Delavega",
                    other: {
                        waiting_for: "client",
                        valid_suggestions_count: 0,
                        suggestions_count: 0
                    }
                },
                {
                    status: "scheduling",
                    subject: "Déj avec Nicolas Berreau",
                    other: {
                        waiting_for: "contact",
                        valid_suggestions_count: 0,
                        suggestions_count: 4
                    }
                },
                {
                    status: "aborted",
                    subject: "Mtg avec Minh Tralus"
                },
                {
                    status: "aborted",
                    subject: "Déj avec Jako Pastorius"
                }
            ]
        }
    }
  end
end