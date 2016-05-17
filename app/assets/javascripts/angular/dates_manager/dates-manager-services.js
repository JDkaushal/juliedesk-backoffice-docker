(function() {

    var app = angular.module('dates-manager-services', []);

    app.service('attendeesService', function(){
        var attendeesApp;
        var that = this;
        var usedTimezones = undefined;
        var allUsedTimezones = undefined;

        this.setup = function() {
            attendeesApp = that.getAttendeesApp();
        };

        this.getAttendeesApp = function() {
            return angular.element($('#attendeesCtrl')).scope();
        };

        this.getAttendeeByEmail = function(email) {
            return attendeesApp.getAttendeeByEmail(email);
        };

        this.getAssisted = function(assistant) {
            return attendeesApp.getAssisted(assistant);
        };

        this.sortTimezones = function(timezones) {
          return   _.sortBy(timezones, function(timezone) {
              return -(moment().tz(timezone)._offset);
          });
        };

        this.getUsedTimezones = function() {
            var that = this;
            allUsedTimezones = [window.threadComputedData.timezone];

            if(window.threadComputedData.is_virtual_appointment) {
                if(!usedTimezones) {
                    usedTimezones = attendeesApp.getUsedTimezones();
                }

                if(usedTimezones.length > 0) {
                    allUsedTimezones = _.uniq(allUsedTimezones.concat(usedTimezones));
                }
            }else {
                usedTimezones = [];
            }

            if(usedTimezones.length > 0) {
                usedTimezones = that.sortTimezones(usedTimezones);
            }

            if(allUsedTimezones.length > 0) {
                allUsedTimezones = that.sortTimezones(allUsedTimezones);
            }
            return {usedTimezones: usedTimezones, allUsedTimezones: allUsedTimezones};
        };

        angular.element(document).ready(function() {
            that.setup();
        });

    });
})();