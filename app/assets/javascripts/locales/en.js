if(!window.wordings) window.wordings = {};

window.wordings['en'] = {
    email_templates: {
        create_events: {
            before_dates: {
                created: "I have added the following to your calendar:\n",
                updated: "I have updated the following in your calendar:\n",
                deleted: "I have deleted the following from your calendar:\n"
            }
        },
        no_date_fits: {
            before_dates: {
                suggested: {
                    singular: "Sorry, %{client} is no longer available at this time, ",
                    plural: "Sorry, %{client} is no longer available at these times, "
                },
                not_suggested: {
                    singular: "Sorry this timeslot is not open, ",
                    plural: "Sorry none of these timeslots are open, "
                }
            },
            before_dates_suffix: {
                postpone: "but here are some new availabilities for %{appointment_nature}%{location}:",
                new_appointment: {
                    suggested: "but would be available for %{appointment_nature}%{location}:",
                    not_suggested: "but %{client} would be available for %{appointment_nature}%{location}:"
                }
            }
        },
        suggest_dates: {
            ask_agreement: {
                postpone: "Would you like me to suggest other availabilities? I have cancelled the original event in the meantime.",
                new_appointment: "Would you like me to suggest some other availabilities?"
            },
            before_dates: {
                new_appointment: {
                    one_client: "%{client} is available for %{appointment_nature}%{location}:",
                    many_clients: "%{other_clients} and %{client} are available for %{appointment_nature}%{location}:",
                },
                postpone: "Here are some new availabilities for %{appointment_nature}%{location}:"
            },
            after_dates: {
                singular: {
                    one_attendee: "\n\nWould that work for you?",
                    many_attendees: "\n\n%{attendees}, would that work for you?",
                },
                plural: {
                    one_attendee: "\n\nWhich time works best for you?",
                    many_attendees: "\n\n%{attendees}, which time works best for you?",
                }
            },
            ask_number: {
                call: "\nPlease let me know where you can be reached.",
                skype: "\nPlease let me know where you can be reached."
            }
        },
        cancel_multiple: {
            cancel: "Cancellation:",
            noted_gonna_cancel: {
                singular: "Duly noted. I will cancel the event:\n",
                plural: "Duly noted. I will cancel these events:\n"
            },
            noted_no_attendees: {
                singular: "Duly noted. But I don't have the email addresses for this event:\n",
                plural: "Duly noted. But I don't have the email addresses for these events:\n"
            },
            but_no_attendees: {
                singular: "\nBut I don't have the email addresses for this event:\n",
                plural: "\nBut I don't have the email addresses for these events:\n"
            },
            what_should_i_do: {
                singular: "\nPlease provide the attendees' email addresses if you would like me to take care of it.",
                plural: "\nPlease provide the attendees' email addresses if you would like me to take care of them."
            }
        },
        postpone_multiple: {
            postpone: "Postpone:",
            noted_gonna_cancel: {
                singular: "Duly noted. I will reschedule the event:\n",
                plural: "Duly noted. I will reschedule these events:\n"
            },
            noted_no_attendees: {
                singular: "Duly noted. But I don't have the email addresses for this event:\n",
                plural: "Duly noted. But I don't have the email addresses for these events:\n"
            },
            but_no_attendees: {
                singular: "\nBut I don't have the email addresses for this event:\n",
                plural: "\nBut I don't have the email addresses for these events:\n"
            },
            what_should_i_do: {
                singular: "\nPlease provide the attendees' email addresses if you would like me to take care of it.",
                plural: "\nPlease provide the attendees' email addresses if you would like me to take care of them."
            }
        },
        invites_sent: {
            new_appointment: "Perfect. I've sent invites for %{appointment_nature}%{location}:\n%{date}%{address}",
            postpone: "Perfect. I updated the event for %{appointment_nature}%{location}:\n%{date}%{address}",
            location_in_template: "\nLocation: %{location}",
            ask_for_location: "\n\nPlease let me know the location if you want me to add it to the event.",
            ask_interlocutor_for_location: "\n\nPlease let me know the location to add it to the event.",
            number_to_call: "Number to call: %{number}\n",
            call_client_on: "Call %{client} at %{number_to_call}"
        },
        info_asked: "Here is the info you asked:",
        confirmation: "Duly noted!",
        cancel: {
            attendees_noticed: "I have cancelled %{appointment_nature} scheduled %{date}.",
            attendees_not_noticed: "Very sorry for the inconvenience, but something has come up and %{client} won't be able to make %{appointment_nature} with you %{date}.",
        },
        cancel_client_agreement: "Should I cancel %{appointment_nature} scheduled %{date}?",
        client_agreement: {
            prefix: {
                available: {
                    singular: "You are available for %{appointment_nature} at this date:\n",
                    plural: "You are available for %{appointment_nature} at these dates:\n"
                },
                not_available: {
                    singular: "You are not available for %{appointment_nature} on this date:\n",
                    plural: "You are not available for %{appointment_nature} on any of those dates:\n"
                }
            },
            suffix: {
                available: {
                    new_appointment: "\nDo you want me to create an event and send an invitation?",
                    postpone: "\nDo you want me to reschedule the appointment?"
                },
                not_available: {
                    new_appointment: "\nWould you like me to suggest a few other availabilities?",
                    postpone: "\nWould you like me to suggest other availabilities to reschedule the appointment?"
                }
            }
        },
        forward_to_client: "Please allow me to forward you this email.\nI remain at your disposal.",
        wait_for_contact: {
            postpone: "Pending your contact's response, before rescheduling I will cancel %{appointment_nature} scheduled %{date}.",
            no_postpone: "Pending your contact's response, I remain at your disposal if you need me to suggest your availabilities beforehand."
        },
        common: {
            default_appointment_designation_in_email: "the meeting",
            custom_address_at: "at %{location}",
            before: "Hi,\n\n",
            before_only_client: "Hi %{client_name},\n\n",
            full_date_format: "dddd D MMMM YYYY h:mm a",
            full_time_format: "h:mm a",
            only_date_format: "dddd D MMMM YYYY",
            simplified_date_format: "dddd D MMMM YYYY",
            date_time_separator: "at",
            only_time_format: "h:mm a",
            timezone_precision: "(Timezone: %{timezone})",
            footer: {
                "juliedesk": "\n\nBest regards,\n\nJulie",//\nIntelligence artificielle",
                "breega": "\n\nBest regards,\n\n\nJulie Filhol",
                "hourlynerd": "\n\nBest regards,\n\nJulie"
            },
            signature: {
                "juliedesk": "",
                "breega": "<br/>\n--<br/>\n<br/>\n<img src='https://lh5.googleusercontent.com/-wbWy7ExZauI/UWvRdxVcsmI/AAAAAAAAAAc/QRQxfD5TBec/w1914-h736-no/130404-BREEG-Logo_FluroGreen.png' width='200' height='76'/><br/>\n<br/>\n<b>Julie Filhol</b><br/>\nExecutive Assistant<br/>\n<br/>\n42 avenue Montaigne<br/>\n75008 Paris - France<br/>\n<br/>\nTel: +33 1 72 74 10 01<br/>\nFax: +33 1 72 74 10 02<br/>\n<br/>\nEmail: <a href='mailto:julie.filhol@breega.com'>julie.filhol@breega.com</a><br/>\nWeb: <a href='www.breega.com'>www.breega.com</a><br/>\n<br/>\nPlease consider the environment and think twice before printing this email ...",
                "hourlynerd": ""
            }
        },
        send_call_instructions: {
            placed_in_notes: "I have included the call instructions in the event.",
            placed_skype_in_notes: "I have noted %{target_name}’s Skype ID in the event.",
            give_target_number: "Call instructions: Reach %{target_name} at %{details}",
            give_target_confcall: "Conference Dialing: \n%{details}",
            give_target_skype: "%{target_name}’s Skype ID was included in the invite: %{details}",
            missing_infos: "Could you please provide a number on which you will be reachable?"
        },
        ask_additional_informations:{
            multiple_attendees:{
                phone: {
                    multiple_recipients: "%{attendees_names}, please%{courtesyString} provide your phone number, just in case!",
                    single_recipient: "%{attendees_names}, please%{courtesyString} provide your phone number, just in case!"
                },
                skype: {
                    multiple_recipients: "%{attendees_names}, could you let me know your Skype IDs?",
                    single_recipient: "%{attendees_names}, could you let me know your Skype ID?"
                }
            },
            single_attendee:{
                phone:{
                    assisted: "Please%{courtesyString} provide %{attendees_names} phone number, just in case!",
                    nonassisted: "Please%{courtesyString} provide your phone number, just in case!"
                },
                skype:{
                    assisted: "Could you let me know %{attendees_names}'s Skype ID?",
                    nonassisted: "Could you let me know your Skype ID?"
                }
            }
        },
        follow_up_confirmation: {
            header: "Got it, I'm going to follow-up on:\n",
            item: "- %{label}\n"
        }
    },
    common: {
        cancel: "Cancel",
        or: "or",
        phone: "Phone:",
        egalement: "also"
    },
    events: {
        new_event: "New event",
        recurring_event: {
            this_event_is_part_of_recurring: "This event is part of a recurring event.",
            what_to_update: "Which occurrences do you want to update?",
            what_to_delete: "Which occurrences do you want to delete?",
            this_occurrence: "This occurrence",
            all_occurrences: "All occurrences"
        },
        call_instructions: {
            contacts_infos: 'Contacts-Infos',
            organizer_infos: "Organizer-Infos",
            title: "Call-Instructions",
            display: "Reach %{target_name} at %{details}",
            display_single_attendee: "%{caller_name} to call %{target_name} at %{details}",
            instructions_in_notes: "Call instructions in the notes",
            give_confcall: "%{details}",
            give_target_number: "Reach %{target_name} at %{details}"
        },
        notes: {
            address_details_boundary: 'Address-Details'
        }
    },
    constraints: {
        cant: "can't",
        can: "can only",
        prefers: "prefers",
        from: "from",
        to: "to",
        from_date: "from",
        to_date: "to",
        every_day: "every day",
        on_days: "on",
        starting_on: "from",
        ending_on: "to",
        invalid_constraint: "Invalid constraint",
        before_days_for: "for ",
        before_days_on: "on "
    },
    actions: {
        to_do: {
            ask_agreement: "To do: ask agreement",
            suggest_dates: {
                new_appointment: "To do: suggest dates",
                postpone: "To do: suggest new dates"
            }
        }
    },
    info_panel: {
      event_does_not_exist_anymore: "This event does not exists anymore.",
      remove_link: "Remove association"
    },
    classification_forms: {
        common: {
            fill_info_in: "Please fill info in"
        },
        ask_date_suggestions: {

        },
        ask_availabilities: {
            dates_identification: "Dates identification",
            suggested_dates: "Suggested dates"
        }
    },

    dates: {
        today: 'today',
        tomorrow: 'tomorrow'
    }
};