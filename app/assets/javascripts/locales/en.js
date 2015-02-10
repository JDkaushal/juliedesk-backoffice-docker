if(!window.wordings) window.wordings = {};

window.wordings['en'] = {
    email_templates: {
        no_date_fits: {
            before_dates: {
                suggested: {
                    singular: "Sorry, %{client} is not available anymore at this time, but will be available :",
                    plural: "Sorry, %{client} is not available anymore at these times, but will be available :"
                },
                not_suggested: {
                    singular: "Sorry this time does not fit, but %{client} would be available:",
                    plural: "Sorry none of these times fit, but %{client} would be available:"
                }
            }
        },
        suggest_dates: {
            before_dates: "%{client} would be available for %{appointment_nature}%{location}:",
            after_dates: "\n\nWhich time would work best for you?"
        },
        postpone: {
            before_dates: "Here are new availabilities to postpone the event:"
        },
        invites_sent: "Perfect, invites sent for %{appointment_nature}%{location}:\n%{date}.",
        info_asked: "Here is the info you asked:",
        confirmation: "Very well, it's noted.",
        cancel: "Very sorry for the setback but unfortunately, %{client} won't be able to ensure the meeting with you %{date}.",
        common: {
            custom_address_at: "at %{location}",
            before: "Hi,\n\n",
            full_date_format: "dddd DD MMMM YYYY, hh:mm a",
            timezone_precision: "(Timezone: %{timezone})",
            footer: {
                "juliedesk": "\n\nBest regards,\n\nJulie",//\nIntelligence artificielle",
                "breega": "\n\nBest regards,\n\n\nJulie Filhol"
            },
            signature: {
                "juliedesk": "",
                "breega": "<br/>\n--<br/>\n<br/>\n<img src='https://lh5.googleusercontent.com/-wbWy7ExZauI/UWvRdxVcsmI/AAAAAAAAAAc/QRQxfD5TBec/w1914-h736-no/130404-BREEG-Logo_FluroGreen.png' width='200' height='76'/><br/>\n<br/>\n<b>Julie Filhol</b><br/>\nExecutive Assistant<br/>\n<br/>\n42 avenue Montaigne<br/>\n75008 Paris - France<br/>\n<br/>\nTel: +33 1 72 74 10 01<br/>\nFax: +33 1 72 74 10 02<br/>\n<br/>\nEmail: <a href='mailto:julie.filhol@breega.com'>julie.filhol@breega.com</a><br/>\nWeb: <a href='www.breega.com'>www.breega.com</a><br/>\n<br/>\nPlease consider the environment and think twice before printing this email ..."
            }
        }
    }
};