(function(){

    var app = angular.module('reply-box-controllers', []);

    app.controller('recipientsManager', ['$scope', '$filter', '$timeout', function($scope, $filter, $timeout) {
        $scope.attendeesApp = $scope.attendeesApp || undefined;
        $scope.initiated = false;
        $scope.ccs = [];
        $scope.tos = [];

        $scope.specialActions = ['ask_date_suggestions', 'ask_availabilities', 'follow_up_contacts'];

        var $ccTokenNode = $("#recipients-cc-input");
        var $toTokenNode = $("#recipients-to-input");
        var $messagesContainer = $('#messages_container');
        var $replyBoxNode = $('#reply-box');

        $scope.actionNature = $replyBoxNode.data('action-nature');

        $scope.init = function() {
            // Maybe define this function directly here
            //if(!window.currentEventTile) {
            $scope.initTokenInputs();
            //}

            if(window.threadAccount)
                setDefaultRecipientsOther();

            if(window.afterReplyBoxInitCallback){
                $timeout(function() {
                    window.afterReplyBoxInitCallback();
                }, 0);
            }
            $scope.initiated = true;
        };

        $scope.setReplyRecipients = function(recipients, otherRecipients) {
            $scope.clearRecipients();

            if (recipients == "only_client") {
                var client = window.clientRecipient();

                if(client.name == '') {
                    client = window.emailSender();
                }

                $scope.tos.push(client);
                if(otherRecipients) {
                    _.each(otherRecipients, function(otherRecipient) {
                        $scope.ccs.push({name: otherRecipient});
                    });
                }
            }
            else if(window.threadComputedData && window.threadComputedData.do_not_ask_suggestions) {

                if((window.classification == 'ask_date_suggestions' && window.julie_action_nature == "check_availabilities") || window.julie_action_nature == 'cancel_event') {
                    var mainClient = window.clientRecipient();
                    var tos_attendees = $scope.attendeesApp.getAttendeesOnlyPresentClients().concat($scope.attendeesApp.getLinkedAttendees());
                    if (mainClient && mainClient["name"]) {
                        $scope.ccs.push(mainClient);
                        tos_attendees = tos_attendees.filter(function (attendee) {
                            return attendee["email"] != mainClient["name"]
                        });

                        // Include julie aliases (except the main one)
                        if(window.julieAliases) {
                            _.each(window.julieAliases, function (julieAlias) {
                                if (window.julieAlias && julieAlias.email != window.julieAlias.email)
                                    $scope.ccs.push({name: julieAlias.email});
                            });
                        }
                    }

                    var tos = tos_attendees.map(function (attendee) {
                        return {name: attendee["email"]};
                    });
                    $scope.tos = tos;
                }
                else {
                    var presentAttendees = $scope.attendeesApp.getAttendeesWithoutThreadOwner();
                    $scope.setDefaultRecipients(otherRecipients, presentAttendees);
                }
            }
            else {
                var presentAttendees = $scope.attendeesApp.getAttendeesWithoutThreadOwner();
                $scope.setDefaultRecipients(otherRecipients, presentAttendees);
            }

            $scope.setRecipients();
        };

        $scope.setRecipients = function() {

            $scope.sanitizeRecipients();

            _.each($scope.tos, function (recipient) {
                $toTokenNode.tokenInput("add", recipient);
            });
            _.each($scope.ccs, function (recipient) {
                $ccTokenNode.tokenInput("add", recipient);
            });
        };

        $scope.sanitizeRecipients = function() {
            // Ensure we have no emails duplicates in Tos and Ccs
            $scope.tos = _.uniq($scope.tos, function(r) {return r.name;});
            $scope.ccs = _.uniq($scope.ccs, function(r) {return r.name;});

            // Reject double already present in tos
            $scope.ccs = _.reject($scope.ccs, function(a) {
                return _.find($scope.tos, function(att) {
                    return  att.name == a.name;
                });
            });
        };

        $scope.setDefaultRecipients = function(otherRecipients, presentAttendees) {
            console.log('action nature', $scope.actionNature);

            if($scope.specialActions.indexOf($scope.actionNature) > -1) {
                setDefaultRecipientsAskOrVerifyAvailabilities();
            }else {
                setDefaultRecipientsOther();
            }
        };

        $scope.clearRecipients = function() {
            $scope.ccs = [];
            $scope.tos = [];

            try {
                $toTokenNode.tokenInput("clear");
                $ccTokenNode.tokenInput("clear");
            } catch(e) {
                console.log(e);
            }

        };

        function manageSingleAssistedWithAssistant(presentAttendees, otherRecipients) {

            var assistant;
            var assisted;
            assisted = _.find(presentAttendees, function(a){
                return a.assistedBy && a.assistedBy.guid;
            });

            if(assisted){
                assistant = $scope.attendeesApp.getAssistant(assisted);
            }

            if(assistant && assisted){
                setAssistantAndAssistedInRecipients(assistant, assisted);
                $scope.ccs.push(window.clientRecipient());
            }else{
                $scope.setDefaultRecipients(otherRecipients, presentAttendees);
            }
        };

        function setDefaultRecipientsAskOrVerifyAvailabilities() {

            var attendees = $scope.attendeesApp.getAttendeesWithEmailOnPresence(true);
            var partitionnedAttendeesWithThreadOwner = _.partition(attendees, function(a) {
                return a.isThreadOwner;
            });

            var threadOwner = partitionnedAttendeesWithThreadOwner[0][0];
            var attendeesWithoutThreadOwner = partitionnedAttendeesWithThreadOwner[1];
            var partitionnedAttendees = _.partition(attendeesWithoutThreadOwner, function(a) {
                if(['ask_availabilities', 'ask_date_suggestions'].indexOf($scope.actionNature) != -1 )
                    return a.isClient || a.linkedAttendee;
                else
                    return a.isClient;
            });

            var clientsAttendees = partitionnedAttendees[0];
            var nonClientAttendees = partitionnedAttendees[1];

            if(nonClientAttendees.length > 0) {
                defaultRecipientsWhenNonClientAttendees(clientsAttendees, nonClientAttendees);
            } else {
                defaultRecipientsWhenOnlyClientAttendees(clientsAttendees);
            }

            if(threadOwner.email != 'pierre-louis@juliedesk.com') {
                // We don't add the client email if we are already responding to one of its aliases or it's main email
                var threadOwnerEmailsInCcs = _.intersection(_.map($scope.ccs, function(cc){return cc.name;}), [window.threadAccount.email].concat(window.threadAccount.email_aliases));

                if( threadOwnerEmailsInCcs.length == 0 ) {
                    $scope.ccs.push({name: threadOwner.email});
                }
            }

            $scope.tos = _.flatten($scope.tos);
            $scope.ccs = _.flatten($scope.ccs);

            $scope.tos = _.map($scope.tos, function(a) {
                return {name: $filter('lowercase')(a.name)};
            });
            $scope.ccs = _.map($scope.ccs, function(a) {
                return {name: $filter('lowercase')(a.name)};
            });
        };

        function defaultRecipientsWhenOnlyClientAttendees(clientAttendees) {
            var sender;
            var senderEmail = window.emailSender();

            // We iterate over each attendee, if he is the original email sender we set him in TO, if not we set him in CCs
            // That way if the original email sender is one of the client attendees we will respond to him, if not we leave the TO field blank
            _.each(clientAttendees, function(a) {

                if(a.email == senderEmail.name) {
                    $scope.tos = [senderEmail];
                }else {
                    $scope.ccs.push({name: a.email});
                }

            });
        };

        function defaultRecipientsWhenNonClientAttendees(clientsAttendees, nonClientAttendees) {
            var partitionnedNonClientAttendees = _.partition(nonClientAttendees, function(a) {
                return a.assisted && a.assistedBy && a.assistedBy.email;
            });

            var assistedNonClientAttendees = partitionnedNonClientAttendees[0];
            var unassistedNonClientAttendees = partitionnedNonClientAttendees[1];

            $scope.tos = _.map(unassistedNonClientAttendees, function(a) {
                return {name: a.email};
            });

            $scope.tos = $scope.tos.concat(_.map(assistedNonClientAttendees, function(a) {
                return {name: a.assistedBy.email};
            }));

            $scope.ccs = _.map(clientsAttendees, function(a) {
                return {name: a.email};
            });

            $scope.ccs = $scope.ccs.concat([window.emailSender()].concat(window.initialToRecipients().concat(window.initialCcRecipients())));
        };

        function setDefaultRecipientsOther() {
            var clientEmails = [window.threadAccount.email].concat(window.threadAccount.email_aliases);

            $scope.tos = [window.emailSender()];
            $scope.ccs = window.initialToRecipients().concat(window.initialCcRecipients());

            $scope.tos = _.compact($scope.tos);
            $scope.ccs = _.compact($scope.ccs);

            if(window.threadAccount.email != 'pierre-louis@juliedesk.com') {

                var clientAliasInTos = _.intersection(_.map($scope.tos, function(recipient) {return recipient.name;}), clientEmails);
                var clientAliasInCcs = _.intersection(_.map($scope.ccs, function(recipient) {return recipient.name;}), clientEmails);

                if(clientAliasInTos.length == 0 && clientAliasInCcs.length == 0) {
                    $scope.ccs.push({name: window.threadAccount.email});
                } else if(clientAliasInTos.length >= 1) {
                    // If we are responding to the client, make sure we don't use one of its aliases in ccs
                    $scope.ccs = _.reject($scope.ccs, function(recipient) {
                        return clientEmails.indexOf(recipient.name) >= 0;
                    });
                }
            }
        };

        function setAssistantAndAssistedInRecipients(assistant, assisted){
            if(!!assistant.email)
                $scope.tos.push({name: assistant.email});

            if(!!assisted.email)
                $scope.ccs.push({name: assisted.email});
        };

        $scope.setRecipientTokenState = function(email, rootNode) {
            var isValidEmail = window.isAuthorizedAttendee(email);
            var tokenNode = rootNode.siblings('.token-input-list-facebook').find(".token-input-token-facebook p:contains('" + email + "')").closest('li');

            if(isValidEmail) {
                tokenNode.removeClass('juliedesk-unauthorized-email');
            } else {
                tokenNode.addClass('juliedesk-unauthorized-email');
                tokenNode.attr('title', 'Adresse email non autorisée');
            }
        };

        $scope.initTokenInputs = function() {

            if (window.tokenInputsInitialized) {
                $toTokenNode.siblings('.token-input-list-facebook').remove();
                $ccTokenNode.siblings('.token-input-list-facebook').remove();
            }
            var allowedEmailsSuggestions = _.map(window.allowedAttendeesEmails, function(email) { return {name: email}});

            // var prePopulateTo = window.initialToRecipients();
            // var prePopulateCc = window.initialCcRecipients();
            var toParams = {
                searchDelay: 0,
                enableFreeInput: true,
                hintText: '',
                noResultsText: '',
                searchingText: '',
                animateDropdown: false,
                prePopulate: window.initialToRecipients(),
                preventDuplicates: true,
                theme: 'facebook',
                onAdd: function (item) {
                    window.toRecipientAdded(item);
                    $scope.setRecipientTokenState(item.name, $toTokenNode);
                    window.checkSendButtonAvailability();
                },
                onDelete: function (item) {
                    window.toRecipientDeleted(item);
                    window.checkSendButtonAvailability();
                }
            };

            var ccParams = {
                searchDelay: 0,
                enableFreeInput: true,
                hintText: '',
                noResultsText: '',
                searchingText: '',
                animateDropdown: false,
                prePopulate: window.initialCcRecipients(),
                preventDuplicates: true,
                theme: 'facebook',
                onAdd: function (item) {
                    window.ccRecipientAdded(item);
                    $scope.setRecipientTokenState(item.name, $ccTokenNode);
                    window.checkSendButtonAvailability();
                },
                onDelete: function (item) {
                    window.ccRecipientDeleted(item);
                    window.checkSendButtonAvailability();
                }
            };
             // As we call this method again after fetching the event if any, we would override the default recipients for the forward_to_client and the free reply
            // We call this method after fetching the event to refresh the autocomplete with the new allowed attendees coming from the event attendees
            if(window.tokenInputsInitialized && (window.classification == 'forward_to_client' || window.classification == 'unknown')) {
                ccParams.prePopulate = $ccTokenNode.tokenInput('get');
                toParams.prePopulate = $toTokenNode.tokenInput('get');
             }


            $toTokenNode.tokenInput(allowedEmailsSuggestions, toParams);
            $ccTokenNode.tokenInput(allowedEmailsSuggestions, ccParams);

            window.tokenInputsInitialized = true;
        };

        angular.element(document).ready(function () {

            $scope.attendeesApp = $scope.attendeesApp || angular.element($('#attendeesCtrl')).scope();

            if(!!$scope.attendeesApp) {
                $scope.attendeesApp.$on('attendeesFetched', function(attendees) {
                    if(!$scope.initiated)
                        $scope.init();
                });
            } else {
                $scope.init();
            }
        });
    }]);

    app.controller('replyBuilder', ['$scope', function($scope) {
        $scope.replyMessage = '';
        $scope.attendeesApp = $scope.attendeesApp || undefined;

        $scope.generateReply = function(params) {
            var notClientAttendees;
            if(params.action == 'ask_additional_informations')
                notClientAttendees = $scope.attendeesApp.getNonClientAndNonAssistantWithMissingInfosAttendees();
            else
                notClientAttendees = $scope.attendeesApp.getNonClientAndNonAssistantAttendees();

            var partitionnedAttendees = _.partition(notClientAttendees, function(a) {
                return a.assisted;
            });

            params['assistedAttendees'] = _.map(partitionnedAttendees[0], function(a) {
                return a.usageName;
            });
            params['unassistedAttendees'] = _.map(partitionnedAttendees[1], function(a) {
                return a.usageName;
            });

            $scope.replyMessage = window.generateEmailTemplate(params);

            return $scope.replyMessage;
        };

        angular.element(document).ready(function() {

            $scope.attendeesApp = $scope.attendeesApp || angular.element($('#attendeesCtrl')).scope();

        });

    }]);

})();