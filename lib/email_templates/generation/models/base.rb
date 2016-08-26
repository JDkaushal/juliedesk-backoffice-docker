module EmailTemplates
  module Generation
    module Models

      class Base

        def initialize(params)
          @params = params
          @output_array = []

          I18n.locale = @params['language']
        end

        def generate
          check_params_integrity

          set_greetings_sentence
          set_body
          set_footer_and_signature
          format_template_response
        end

        private

        def get_required_params
          raise('Not implemented on parent class')
        end

        def get_attendees_without_thread_owner
          @params['participants'].reject{|att| att['is_thread_owner']}
        end

        def get_thread_owner
          @params['participants'].find{|att| att['is_thread_owner']}
        end

        def get_attendees_names
          attendees_count = get_attendees_count - 1 # We substract the thread owner
          attendees_count_last_index = attendees_count - 1
          attendees_count_before_last_index = attendees_count - 2

          attendees_str = ''

          get_attendees_without_thread_owner.each_with_index do |attendee, index|
            attendees_str += attendee['first_name']

            if attendees_count > 1 && index < attendees_count_last_index
              if index < attendees_count_before_last_index
                attendees_str += ', '
              else
                attendees_str += " #{I18n.translate('email_templates.common.or')} "
              end
            end
          end

          attendees_str
        end

        def get_clients
          @params['participants'].select{|att| att['is_client']}
        end

        def get_clients_count
          1
        end

        def get_attendees_count
          @params['participants'].size
        end

        def get_appointment_type
          @params['appointment']
        end

        def get_location
          @params['location']
        end

        def get_julie_alias_footer
          @params['julie_alias'].send("footer_#{I18n.locale}")
        end

        def check_params_integrity
          missing_args = []
          get_required_params.each do |param|
            unless @params.keys.include?(param)
              missing_args.push(param)
            end
          end

          unless missing_args.blank?
            raise ArgumentError.new("Missing required argument(s): #{missing_args.join(', ')}")
          end
        end

        def add_to_output_array(str)
          @output_array.push(str)
        end

        def set_greetings_sentence
          #write_to_output(I18n.translate("email_templates.greetings.#{@params.}", client_name: @params.))
          #add_to_output_array(I18n.translate("email_templates.greetings.M", client_name: 'Fred'))
          add_to_output_array(I18n.translate("email_templates.common.hello").capitalize)
        end

        def set_body
          raise('Not implemented on parent class')
        end

        def set_footer_and_signature
          # TODO Integrate Julie Alias signature

          add_to_output_array(get_julie_alias_footer)
        end

        def format_template_response
          @output_array.join("\n")
        end

      end
    end
  end
end