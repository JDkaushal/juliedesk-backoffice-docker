window.classificationForms.askDateSuggestionsForm = function (params) {
    window.classificationForms.classificationForm.isParentOf(this, params);

    var askDateSuggestionsForm = this;
    // Used to have a common accessor between all the different forms
    var currentClassifForm = askDateSuggestionsForm;

    window.leftColumnMessage = localize("classification_forms.common.fill_info_in");

    window.submitClassification = function () {
        if(window.featuresHelper.isFeatureActive("auto_date_suggestions_from_backend")) {
            currentClassifForm.fetchDateSuggestionsFromAi(function(dateSuggestionsFromAi) {
                askDateSuggestionsForm.sendForm({
                    dateSuggestionsFromAi: dateSuggestionsFromAi
                });
            });
        }
        else {
            askDateSuggestionsForm.sendForm();
        }

    };

    if(window.messagesDispatcher) {
        window.messagesDispatcher.registerListener("info-panel-next-item-event", function () {
            if(window.featuresHelper.isFeatureActive("auto_date_suggestions_from_backend") && $(".subject-form-entry:visible").length > 0) {
                askDateSuggestionsForm.initiatePutsCalendarInConscienceCacheIfNeeded();
            }
        });
    }


    $(function () {
        $(".client-agreement-panel .yes-button").click(function () {
            window.acceptClientAgreement();
        });

        askDateSuggestionsForm.checkClientAgreement();

        //bypassClientAgreementIfPossible();
        window.acceptClientAgreement();
    });

    window.acceptClientAgreement = function() {
        askDateSuggestionsForm.validateClientAgreement(true, false);
    };
};
window.classificationForms.askDateSuggestionsForm.prototype.initiatePutsCalendarInConscienceCacheIfNeeded = function() {
    var askDateSuggestionsForm = this;
    if(askDateSuggestionsForm.calendarConscienceCacheInitiated) {
        return;
    }
    askDateSuggestionsForm.calendarConscienceCacheInitiated = true;
    askDateSuggestionsForm.calendarConscienceCacheLoading(true);
    askDateSuggestionsForm.putsCalendarInConscienceCache(function() {
        askDateSuggestionsForm.calendarConscienceCacheLoading(false);
    }, function() {
        askDateSuggestionsForm.calendarConscienceCacheLoading(false);
    });
};
window.classificationForms.askDateSuggestionsForm.prototype.calendarConscienceCacheLoading = function(isLoading) {
    if(isLoading) {
        $(".submit-classification").prop("disabled", true)
    }
    else {
        $(".submit-classification").prop("disabled", false)
    }
};
window.classificationForms.askDateSuggestionsForm.prototype.putsCalendarInConscienceCache = function(successCallback, errorCallback) {
    var askDateSuggestionsForm = this;
    var attendeesControllerScope = $('#attendeesCtrl').scope();
    var aiDatesSuggestionsManagerScope = $('#ai_dates_suggestions_manager').scope();

    var meetingRoomsToShow = askDateSuggestionsForm.getMeetingRoomsToShow();

    var fetchParams = {
        account_email: window.threadAccount.email,
        attendees: attendeesControllerScope.attendees,
        thread_data: {
            appointment_nature: $("#appointment_nature").val(),
            location: $("#location").val(),
            duration: parseInt($("#duration").val(), 10),
            timezone: askDateSuggestionsForm.getTimezoneForSendForm()
        },
        raw_constraints_data: askDateSuggestionsForm.getConstraintsDataForSendForm(),
        compute_linked_attendees: true,
        message_id: $('.email.highlighted').data('message-id'),
        old_attendees: _.filter(window.threadComputedData.attendees, function(att) { return att.isPresent == 'true' }),
        meeting_rooms_to_show: meetingRoomsToShow
    };

    aiDatesSuggestionsManagerScope.putsCalendarInConscienceCache(fetchParams).then(function(response) {
        var data = response.data;
        successCallback(data);
    }, function(error) {
        errorCallback(error.status === 408 ? 'timeout' : 'error');
    });
};

window.classificationForms.askDateSuggestionsForm.prototype.fetchDateSuggestionsFromAi = function(successCallback, errorCallback) {
    var askDateSuggestionsForm = this;
    var suggestionsToGet = 4;
    var attendeesControllerScope = $('#attendeesCtrl').scope();
    var aiDatesSuggestionsManagerScope = $('#ai_dates_suggestions_manager').scope();

    var meetingRoomsToShow = askDateSuggestionsForm.getMeetingRoomsToShow();

    var version = "stable";

    var fetchParams = {
        account_email: window.threadAccount.email,
        thread_data: {
            appointment_nature: $("#appointment_nature").val(),
            location: $("#location").val(),
            duration: parseInt($("#duration").val(), 10),
            timezone: askDateSuggestionsForm.getTimezoneForSendForm(),
        },
        compute_linked_attendees: true,
        old_attendees: _.filter(window.threadComputedData.attendees, function(att) { return att.isPresent == 'true' }),
        n_suggested_dates: suggestionsToGet,
        attendees: attendeesControllerScope.attendees,
        message_id: $('.email.highlighted').data('message-id'),
        multi_clients: false,
        meeting_rooms_to_show: meetingRoomsToShow,
        asap: $("input[name='asap_constraint']:checked").length > 0,
        version: version,
        client_on_trip: $("#client-on-trip-data-entry").scope().value,
        raw_constraints_data: askDateSuggestionsForm.getConstraintsDataForSendForm()
    };

    aiDatesSuggestionsManagerScope.fetchSuggestedDatesByAi(fetchParams).then(function(response) {
        var data = response.data;
        successCallback(data);
    }, function(error) {
        errorCallback(error.status === 408 ? 'timeout' : 'error');
    });
};

window.classificationForms.askDateSuggestionsForm.prototype.getMeetingRoomsToShow = function() {
    var meetingRoomsToShow = {};
    _.each($('.calendar-item.is-meeting-room input[type="checkbox"]:checked'), function (c) {
        var calendarItemNode = $(c).closest('.calendar-item');

        meetingRoomsToShow[calendarItemNode.data('calendar-login-username')] = meetingRoomsToShow[calendarItemNode.data('calendar-login-username')] || [];
        meetingRoomsToShow[calendarItemNode.data('calendar-login-username')].push(calendarItemNode.data('calendar-id'));
    });
    return meetingRoomsToShow;
};