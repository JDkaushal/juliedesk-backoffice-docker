(function() {

    var app = angular.module('dates-manager-controllers', []);

    app.controller('datesSuggestionsManager', ['$scope', 'attendeesService', function($scope, attendeesService) {
        $scope.timeSlotsSuggestions = {};
        $scope.timeSlotsSuggestedByAi = [];
        $scope.usedTimezones = undefined;
        $scope.allUsedTimezones = undefined;
        $scope.outBoundSuggestionsCount = 0;
        $scope.displayDatesSuggestionManager = false;

        $scope.showAiLoader = false;
        $scope.aiErrorMessage = 'Jul.IA indisponible';
        $scope.showAiError = false;
        $scope.aiWarningMessage = "Jul.IA n'as pas trouvé de dates";
        $scope.showAiWarning = false;

        $scope.AIsuggestionsTrackingId = undefined;

        var aiDatesSuggestionManager = $('#ai_dates_suggestions_manager');

        $scope.init = function() {
            $scope.attachEventsToDom();
            //$scope.fetchAiDatesSuggestions();
        };

        $scope.aiSuggestionsRemaining = function() {
            return $scope.getTimeSlotsSuggestedByAi().length > 0;
        };

        $scope.nextBtnDisabled = function() {
            return $scope.aiSuggestionsRemaining();
        };

        // Aggregate the current thread constraint with the current appointment default constraints
        $scope.generateTimeConstraints = function() {
            var calendar = window.currentCalendar;
            var timezone = calendar.getCalendarTimezone();

            var today = moment().startOf('day').tz(timezone);
            var oneMonthLater = today.clone().add('month', 1);

            //return timeConstraints.concat($('#appointment_times_constraints_helper').scope().getTimesConstraintsEventsForCurrentAppointment(moment(), moment().add('w', 3)));
            return window.currentCalendar.getConstraintsDataEvents(today, oneMonthLater);
        };

        $scope.mouseEnterSuggestionNode = function(suggestion) {
            if(suggestion.fromAi) {
                $('#' + suggestion.trackingId).addClass('highlighted');
                // var eventInCalendar = $scope.findAiEventInCalendar(suggestion);
                // eventInCalendar.isHighlighted = true;
                // console.log('here');
                // window.currentCalendar.reRenderEvents();
                // console.log('rerender');
            }
        };

        $scope.mouseLeaveSuggestionNode = function(suggestion) {
            if(suggestion.fromAi) {
                $('#' + suggestion.trackingId).removeClass('highlighted');
                // var eventInCalendar = $scope.findAiEventInCalendar(suggestion);
                // eventInCalendar.isHighlighted = false;
                // window.currentCalendar.reRenderEvents();
            }
        };

        $scope.actionOnAiSuggestion = function(trackingId, type) {
            var event = _.find($scope.timeSlotsSuggestedByAi, function(ev) {
                return ev.trackingId == trackingId;
            });

            switch(type) {
                case 'highlight':
                    event.isHighlighted = true;
                    break;
                case 'unhighlight':
                    event.isHighlighted = false;
                    break;
            }

            $scope.setSuggestions();
        };

        $scope.highlightAiSuggestion = function(trackingId) {
            var eventTo

        };

        $scope.unhighlightAiSuggestion = function(trackingId) {

        };

        $scope.fetchAiDatesSuggestions = function(forceFetch) {
            if(forceFetch || $scope.shouldFetchAiSuggestedDates()) {
                var fetch = true;
                var suggestionsToGet = 4;

                if(window.classification == 'follow_up_contacts'){
                    //var alreadySuggestedEvents = window.currentCalendar.$selector.find('#calendar').fullCalendar('clientEvents', function(ev) {return ev.alreadySuggested;});

                    // suggestedDateTimes comes from julie_actions/_follow_up_contacts.html.erb
                    var alreadySuggestedDates = suggestedDateTimes;
                    // When in a follow up contacts scenario we only fetch AI suggestion when we have less than 4 already suggested dates
                    // we complete it to 4 if it is not the case
                    fetch = alreadySuggestedDates.length < 4;

                    if(fetch) {
                        suggestionsToGet -= alreadySuggestedDates.length;
                    }
                }

                if(fetch) {
                    var fetchParams = {
                        account_email: window.threadAccount.email,
                        thread_data: window.threadComputedData,
                        time_constraints: $scope.generateTimeConstraints(),
                        n_suggested_dates: suggestionsToGet,
                        attendees: $('#attendeesCtrl').scope().attendees,
                        message_id: $('.email.highlighted').data('message-id')
                    };

                    $scope.showAiLoader = true;
                    $scope.displayDatesSuggestionManager = true;
                    $scope.$apply();
                    aiDatesSuggestionManager.scope().fetchSuggestedDatesByAi(fetchParams).then(function(response) {
                        var data = response.data;

                        data.suggested_dates = _.sortBy(data.suggested_dates);

                        $scope.AIsuggestionsTrackingId = data.suggested_dates_id;

                        _.each((data.suggested_dates || []), function(slot) {
                            // We add a pureAi property to differentiate with the events that are handled as AI but are not
                            // i.e: events that comes from contact follow ups
                            $scope.addTimeSlotSuggestedByAI({value: moment(slot), pristineValue: slot, fromAi: true, display: true, pureAi: true, trackingId: generateTrackingGuid()});
                        });

                        if($scope.timeSlotsSuggestedByAi.length > 0) {
                            checkSendButtonAvailability();
                            $scope.addSuggestedDatesByAiToCalendar();
                            $scope.setSuggestions();
                            window.currentCalendar.goToDateTime($scope.timeSlotsSuggestedByAi[0].value);
                        } else {
                            $scope.showAiWarning = true;
                            $scope.$apply();
                        }
                    }, function(error) {
                        //console.log('error', error);
                        $scope.showAiError = true;
                        $scope.$apply();
                    }).finally(function() {
                        $scope.showAiLoader = false;
                        $scope.$apply();
                    });

                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            }
        };

        $scope.addSuggestedDatesByAiToCalendar = function() {
            var calendar = window.currentCalendar;
            var calendarCurrentDuration = calendar.getCurrentDuration();
            var calendarDelayTitle = calendar.generateDelayTitle();

            // We don't insert in the calendars the events that have already been inserted (i.e. in the follow_up_contacts
            // scenario) we insert the previously suggested events (that are in the future etc..) with a special title
            // and be treat them like they were Ai suggestions so we will not insert them again here
            var slotsToInsertInCalendar = _.reject($scope.timeSlotsSuggestedByAi, function(slot) {
                return slot.alreadyInsertedInCalendar;
            });

            window.currentCalendar.addCal(_.map(slotsToInsertInCalendar, function(date) {
                var realStart = date.value.clone();
                var realEnd = realStart.clone();
                realEnd.add('m', calendarCurrentDuration);

                return{
                    summary: calendarDelayTitle,
                    start: {dateTime: realStart},
                    end: {dateTime: realEnd},
                    isSuggestionFromAi: true,
                    trackingId: date.trackingId
                };
            }));
        };

        $scope.removeAiEventFromCalendar = function(slot) {
            window.currentCalendar.$selector.find("#calendar").fullCalendar("removeEvents", function (ev) {
                return ev.isSuggestionFromAi
                    && ev.start.isSame(slot);
            });
        };

        $scope.acceptAiSuggestion = function(slot) {
            var calendar = window.currentCalendar;
            var currentTimezone = calendar.getCalendarTimezone();

            var slotToAccept = _.find($scope.timeSlotsSuggestedByAi, function(currentSlot) {
                return currentSlot.value.isSame(slot);
            });

            // We don't display the slot anymore on the right because it will be replaced with a real suggestion as if
            // the operator selected it (which will be binded to the calendar)
            slotToAccept.display = false;
            slotToAccept.accepted = true;
            $scope.removeAiEventFromCalendar(slot);

            var realStart = slotToAccept.value.clone().tz(currentTimezone);

            var realEnd = realStart.clone();
            realEnd.add('m', calendar.getCurrentDuration());

            var eventData = calendar.generateEventData({
                title: calendar.generateDelayTitle(),
                start: realStart,
                end: realEnd,
                calendar_login_username: calendar.initialData.default_calendar_login_username,
                calendar_login_type: calendar.initialData.default_calendar_login_type,
                calendar_login_email: calendar.initialData.email,
                trackingId: slotToAccept.trackingId
            });

            calendar.$selector.find('#calendar').fullCalendar('renderEvent', eventData, true);
            calendar.addEvent(eventData);
            calendar.drawEventList();

            checkSendButtonAvailability();
        };

        $scope.rejectAiSuggestion = function(slot) {
            var slotToReject = _.find($scope.timeSlotsSuggestedByAi, function(currentSlot) {
                return currentSlot.value.isSame(slot);
            });

            slotToReject.display = false;
            slotToReject.rejected = true;
            $scope.removeAiEventFromCalendar(slot);
            window.currentCalendar.drawEventList();

            checkSendButtonAvailability();
        };

        $scope.addTimeSlotSuggestedByAI = function(slot) {
            $scope.timeSlotsSuggestedByAi.push(slot);
            $scope.timeSlotsSuggestedByAi = _.uniq($scope.timeSlotsSuggestedByAi, function(ev) {
                return ev.value.valueOf();
            });
            checkSendButtonAvailability();
        };

        $scope.getTimeSlotsSuggestedByAi = function() {
            return _.filter($scope.timeSlotsSuggestedByAi, function(slot) {
                return slot.display;
            });
        };

        $scope.shouldFetchAiSuggestedDates = function() {
            return ['ask_date_suggestions', 'follow_up_contacts'].indexOf(window.classification) > -1;
        };

        $scope.onMainTimezoneChange = function(selection) {
            window.threadComputedData.timezone = selection.value;
            $('#event_creation_timezone').val(window.threadComputedData.timezone);
            $scope.addTimezoneToCurrentCalendar(selection.value);
            if($scope.timeSlotsSuggestedByAi.length > 0) {
                $scope.addSuggestedDatesByAiToCalendar();
            }

            $scope.setSuggestions();
        };

        $scope.nextButtonClickAction = function(e) {
            trackActionV2('Click_on_close_calendar', {ux_element: 'calendar'});
            $(".calendar-container").addClass("minimized");
            $('.email.extended').removeClass('extended');
            $(".left-column").animate({scrollTop: $(".reply-box").position().top + 30}, 300);
        };

        $scope.attachEventsToDom = function() {
            $('#dates_suggestion_timezone').timezonePicker({
                onSelectCallback: $scope.onMainTimezoneChange
            });

            $(".time-slots-to-suggest-list-container").on('click', '.suggest-dates-next-button', $scope.nextButtonClickAction);
        };

        // We only display in the email template the dates selected by the operator and those coming from the AI and accepted
        // by the operator
        $scope.useSlotInTemplate = function(slot) {
            return !slot.fromAi;
        };

        $scope.getTimeSlotsSuggestionsForTemplate = function() {
            var result = [];
            var tmpResult = [];
            var subResult = {};
            var clientTimezoneGroupedDates = {};

            var clientTimezoneDates = _.map($scope.timeSlotsSuggestions[window.threadComputedData.timezone], function(timeSlot) { return timeSlot.value ; });

            clientTimezoneGroupedDates = _.groupBy(clientTimezoneDates, function(timeSlot) {
                return timeSlot.format('YYYY-MM-DD');
            });

            var currentIndex, currentSlot;
            _.each(clientTimezoneGroupedDates, function(timeSlots, date) {
                subResult = {};
                _.each(timeSlots, function(timeSlot) {
                    currentIndex = clientTimezoneDates.indexOf(timeSlot);

                    _.each($scope.allUsedTimezones, function(timezone) {

                        currentSlot = $scope.timeSlotsSuggestions[timezone][currentIndex];

                        if($scope.useSlotInTemplate(currentSlot)) {
                            if(!subResult[timezone]) {
                                subResult[timezone] = [currentSlot.value];
                            } else {
                                subResult[timezone].push(currentSlot.value);
                            }
                        }
                    });
                });

                if(!$.isEmptyObject(subResult)) {
                    tmpResult.push(subResult);
                }
            });

            var currentDay;
            subResult = {};
            var indexTouched = [];
            // Timezone choosen to act as a default timezone
            // Used to for example get the number of propositions done in general (as it is the same for all timezones
            // Choosen arbitrary (the first one)
            var referenceTimezone = $scope.allUsedTimezones[0];
            var tmpSlotProp = {};
            var resultToAdd = {};
            var indexToSlice;

            _.each(tmpResult, function(slotProposition) {
                // Allow destructive manipulation without affecting the main object (we are using slice)
                tmpSlotProp = $.extend(true, {}, slotProposition);
                // Get the number of slots for this proposition
                // Each timezone will have the same number of propositions
                var slotsNumber = slotProposition[referenceTimezone].length;

                _.each($scope.allUsedTimezones, function(timezone) {
                    var propositionInTimezone = slotProposition[timezone];
                    currentDay = moment(propositionInTimezone[0]);

                    for(var i=0; i<slotsNumber; i++) {

                        if(indexTouched.indexOf(i) == -1){
                            if(!moment(propositionInTimezone[i]).isSame(currentDay, 'day')) {
                                subResult = {};
                                _.each($scope.allUsedTimezones, function(timezone) {
                                    // We remove the slot from each timezone and add it to the subResult
                                    indexToSlice = tmpSlotProp[timezone].indexOf(slotProposition[timezone][i]);
                                    tmpSlotProp[timezone].splice(indexToSlice, 1);
                                    subResult[timezone] = [slotProposition[timezone][i]];
                                });
                                resultToAdd[i] = subResult;
                                indexTouched.push(i);
                            }
                        }
                    }
                });

                if(tmpSlotProp[referenceTimezone].length > 0) {
                    result.push(tmpSlotProp);
                }

                resultToAdd  = _.compact(_.flatten(_.map(resultToAdd, function(v, _){ return v})));

                result = result.concat(resultToAdd);
                resultToAdd = [];
                indexTouched = [];
            });
            return result;
        };

        $scope.addTimezoneToCurrentCalendar = function(timezone) {
            currentCalendar.initialData.additional_timezone_ids.push(timezone);
            currentCalendar.redrawTimeZoneSelector();
            currentCalendar.selectTimezone(timezone, true);
        };

        $scope.clearPreviousSuggestions = function() {
            $scope.timeSlotsSuggestions = {};
            $scope.outBoundSuggestionsCount = 0;
        };

        $scope.displayOutBoundCount = function() {
            return $scope.outBoundSuggestionsCount > 0;
        };

        $scope.getTimeSlotsToSuggest = function() {
            return window.timeSlotsToSuggest.concat($scope.getTimeSlotsSuggestedByAi());
        };

        $scope.setSuggestions = function(forceDisplayManager) {
            //forceDisplayManager is used in the follow_up_contacts flow, because in this one 0 propostions are a possible choice,
            // So we must display the 'Next' button to allow the operator to generate the template

            $scope.clearPreviousSuggestions();

            var suggestions = _.sortBy($scope.getTimeSlotsToSuggest(), function(slot) {
                return moment(slot.value || slot).valueOf();
            });

            if(suggestions.length > 0 || forceDisplayManager) {
                $scope.displayDatesSuggestionManager = true;

                var timezones = $scope.getUsedTimezones();

                _.each(timezones, function(timezone) {
                    $scope.timeSlotsSuggestions[timezone] = [];
                    _.each(suggestions, function(suggestion) {
                        $scope.timeSlotsSuggestions[timezone].push( $scope.addTimeSlotSuggestion(timezone, angular.copy(suggestion)) );
                    });
                });
            } else {
                $scope.displayDatesSuggestionManager = false;
            }

            if(!$scope.$$phase)
                $scope.$apply();
        };

        $scope.addTimeSlotSuggestion = function(timezone, suggestion) {
            // Initially, the suggestions are only dates represented as strings like "2016-10-19T15:30:00+02:00"
            // But we can now also provide richer data by using objects. Note that the effective value of the suggestion must
            // be passed as the 'value' property avec le object
            if(angular.isString(suggestion)) {
                suggestion = { value: moment(suggestion).tz(timezone) };
            } else if(angular.isObject(suggestion)) {
                suggestion.value = suggestion.value.tz(timezone);
            }

            //suggestion = moment(suggestion).tz(timezone);

            var suggestionDisplayText = window.helpers.capitalize(suggestion.value.locale(window.threadComputedData.locale).format(localize("email_templates.common.full_date_format")));

            $.extend(suggestion, {
                displayText: suggestionDisplayText,
                isOutBound: false
            });

            if($scope.checkSuggestionTimeOutBound(suggestion.value)) {
                suggestion.isOutBound = true;
                $scope.outBoundSuggestionsCount += 1;
            }

            return suggestion;
        };

       $scope.getAppointmentWorkingHours = function() {
         return {
             start: [8, 0],
             end: [21, 0]
         }
       };

        $scope.checkSuggestionTimeOutBound = function(suggestion) {
            var hour = suggestion.hour();
            var minutes = suggestion.minute();
            var timeBoundaries = $scope.getAppointmentWorkingHours();

            var lowerOutBound = hour < timeBoundaries.start[0] || (hour == timeBoundaries.start[0] && minutes < timeBoundaries.start[1]);
            var higherOutBound = hour > timeBoundaries.end[0] || (hour == timeBoundaries.end[0] && minutes > timeBoundaries.end[1]);

            return lowerOutBound || higherOutBound;
        };

        $scope.getUsedTimezones = function() {
             //Allow to refresh the thread timezone if it was updated
            //$scope.allUsedTimezones = [window.threadComputedData.timezone];
            //
            //if(window.threadComputedData.is_virtual_appointment) {
            //    if(!$scope.usedTimezones) {
            //        $scope.usedTimezones = attendeesService.getUsedTimezones().allUsedTimezones;
            //    }
            //
            //    if($scope.usedTimezones.length > 0) {
            //        $scope.allUsedTimezones = _.uniq($scope.allUsedTimezones.concat($scope.usedTimezones));
            //    }
            //}else {
            //    $scope.usedTimezones = [];
            //}
            //
            //return $scope.allUsedTimezones;
            var result = attendeesService.getUsedTimezones();

            if(result) {
                $scope.usedTimezones = result.usedTimezones;
                $scope.allUsedTimezones = result.allUsedTimezones;
            }


            return $scope.allUsedTimezones;
        };

        $scope.getAttendeesApp = function() {
            return attendeesService.getAttendeesApp();
        };

        $scope.getPureAiSuggestions = function() {
            return _.filter($scope.timeSlotsSuggestedByAi, function(slot) {
                return slot.pureAi;
            });
        };

        $scope.getValidatedAiSuggestions = function() {
            return _.filter($scope.timeSlotsSuggestedByAi, function(slot) {
                return slot.pureAi && slot.accepted;
            });
        };

        $scope.findAiEventInCalendar = function(slot) {
            return currentCalendar.$selector.find("#calendar").fullCalendar("clientEvents", function (ev) {
                return ev.trackingId == slot.trackingId;
            })[0];
        };

        $scope.computeLearningStatusOnSuggestion = function(suggestion) {
            var status = undefined;
            var result = {};

            if(suggestion.rejected) {
                status = false;
            } else {
                var currentEvent = $scope.findAiEventInCalendar(suggestion);

                if(currentEvent) {
                    status = currentEvent.start.isSame(suggestion.value) ? true : 'moved';
                } else {
                    status = 'removed';
                }

            }

            result[suggestion.pristineValue] = status;
            return result;
        };

        $scope.sendLearningData = function() {
            var suggestionsStatus = _.map($scope.timeSlotsSuggestedByAi, function(slot) {
                return $scope.computeLearningStatusOnSuggestion(slot);
            });

            var data = {
                suggestions_status: suggestionsStatus,
                id: $scope.AIsuggestionsTrackingId
            };

            aiDatesSuggestionManager.scope().sendLearningData(data);
        };

        $scope.trackSuggestedDates = function() {
            trackActionV2('dates_suggestions', {
                calendars_types: _.map(window.threadAccount.calendar_logins, function(cal) {return cal.type;}),
                ai_call_failed: $scope.showAiError,
                ai_suggested_dates_count: $scope.getPureAiSuggestions().length,
                validated_ai_dates_count: $scope.getValidatedAiSuggestions().length,
                suggested_dates_count: $scope.timeSlotsSuggestions[Object.keys($scope.timeSlotsSuggestions)[0]].length
            });

            $scope.sendLearningData()
        };

        $scope.init();
    }]);

    app.controller('datesIdentificationsManager', ['$scope', 'attendeesService', 'messageInterpretationsService', function($scope, attendeesService, messageInterpretationsService) {
        $scope.datesToIdentify = [];
        $scope.usedTimezones = [];
        $scope.selectedTimezone = undefined;
        $scope.showAlreadySuggestedArea = true;
        $scope.showDetectedDatesArea = false;
        $scope.loading = false;

        $scope.aiDatesToCheck = [];

        $scope.init = function() {
            $scope.getUsedTimezones();
            $scope.selectCorrectTimezone();
            $scope.setAiDatesToCheck();
            $scope.getDatesToIdentify();

            $scope.loading = false;
            if(!$scope.$$phase)
                $scope.$apply();

            if(window.datesIdentificationManageInitiatedCallback) {
                window.datesIdentificationManageInitiatedCallback();
            }
        };

        $scope.setAiDatesToCheck = function() {
            var mainInterpretation = messageInterpretationsService.getMainInterpretation();

            if(mainInterpretation) {
                $scope.aiDatesToCheck = _.map(mainInterpretation.dates_to_check, function(date) {
                    return moment(date);
                });
            }
        };

        $scope.showAlreadySuggestedDates = function() {
            $scope.showAlreadySuggestedArea = true;
            $scope.showDetectedDatesArea = false;
        };

        $scope.showDetectedDates = function() {
            $scope.showAlreadySuggestedArea = false;
            $scope.showDetectedDatesArea = true;
            $(".detected-dates-container").show();
        };

        $scope.getDatesToIdentify = function() {

            if(!!$scope.selectedTimezone) {

                var data = $('#dates-identifications-manager').data('dates-to-identify');

                $scope.datesToIdentify = [];
                _.each(data, function(date) {
                    // Create a clone of the object so modifications on it does not affect the original
                    $scope.datesToIdentify.push($.extend({}, date));
                });

                $scope.datesToIdentify = _.uniq($scope.datesToIdentify, function(date) {
                    return date.date;
                });

                $scope.computeDataOnDatesToIdentify();
            }
        };

        $scope.computeDataOnDatesToIdentify = function() {
            var currentTimezonedDate;

            _.each($scope.datesToIdentify, function(date) {
                currentTimezonedDate = moment(date.date).tz($scope.selectedTimezone);

                date['displayText'] = currentTimezonedDate.locale(window.threadComputedData.locale).format(localize("email_templates.common.full_date_format"));
                date['timezone'] = $scope.selectedTimezone;

                _.every($scope.aiDatesToCheck, function(dateToCheck) {
                    if(currentTimezonedDate.isSame(dateToCheck)) {
                        // We trigger the change event to undisable the "Oui" button in the suggestion date pannel
                        date['selected'] = true;
                        return false;
                    }
                    return true;
                });
            });
        };

        $scope.selectCorrectTimezone = function() {
            if(window.emailSender) {
                var emailSender = window.emailSender();

                if(emailSender) {
                    emailSender = emailSender.name;
                }

                var emailSenderAttendee = attendeesService.getAttendeeByEmail(emailSender);
                if(emailSenderAttendee) {
                    var selectedTimezone = emailSenderAttendee.timezone;

                    if(emailSenderAttendee.isThreadOwner) {
                        // We do it because the default timezone of the thread owner can be different from the one set for the Thread,
                        // we assume that the timezone of the thread is the timezone of the client for this appointment
                        selectedTimezone = window.threadComputedData.timezone;
                    } else if(emailSenderAttendee.isAssistant) {
                        // When the attendee is an assistant we are gonna take the timezone of the person he is assisting
                        var assisted = attendeesService.getAssisted(emailSenderAttendee);

                        if(assisted) {
                            selectedTimezone = assisted.timezone;
                        }
                    }

                    $scope.selectedTimezone = selectedTimezone;

                    //$scope.setTimezoneOnAppointment();
                }

            }
        };

        $scope.getUsedTimezones = function() {
            $scope.usedTimezones = attendeesService.getUsedTimezones().allUsedTimezones;
        };

        $scope.getSelectedDatesToIdentify = function() {
            var selectedDates = _.filter($scope.datesToIdentify, function(date) {
                return date.selected;
            });

            var timezone = window.threadComputedData.timezone;
            var currentLocale = window.threadComputedData.locale;
            var currentTimezonedDate;

            selectedDates = _.each(selectedDates, function(date) {
                date.timezone = timezone;
                currentTimezonedDate = moment(date.date).tz(timezone);
                date.date_with_timezone = currentTimezonedDate;
                //date.displayText = currentTimezonedDate.locale(currentLocale).format(localize("email_templates.common.full_date_format"));
            });

            return selectedDates;
        };

        $scope.nextButtonDisabled = function() {
          var selectedDates = $scope.getSelectedDatesToIdentify();

          return selectedDates && selectedDates.length == 0;
        };

        $scope.setTimezoneOnAppointment = function() {
            $('#timezone').val($scope.selectedTimezone);
        };

        $scope.listenToAttendeesAppEvents = function() {
            $scope.loading = true;
            $scope.$apply();

            var attendeesApp = attendeesService.getAttendeesApp();

            if(!!attendeesApp) {
                attendeesApp.$on('attendeesFetched', function(event, args) {
                    $scope.init();
                });
            }
        };

        angular.element(document).ready(function() {
            $scope.listenToAttendeesAppEvents();
        });

    }])
})();