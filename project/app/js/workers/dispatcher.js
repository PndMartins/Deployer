Dispatcher = function() {
    var self = this;
    self.fifo = null;
    self.completeFunction = null;
    self.reportFunction = null;
    self.currentStep = 0;

    self.Init = function(completeCallBack, reportCallback = null) {
        self.fifo = new Array();
        self.completeFunction = completeCallBack;
        self.reportFunction = reportCallback;
        self.currentStep = 0;
        self.max = 0;
    }

    self.PlaceOperation = function(functionToCall, parameters, OptionalMessage = "") {
        //Adds a callback to this object
        parameters.push(self.PerformOperations);

        //Pushes the operation into the list
        self.fifo.push({
            function: functionToCall,
            params: parameters,
            message: OptionalMessage
        });
    }

    self.PerformOperations = function() {
        //ensures that the max value is only filled at the first entrance of this method
        self.max = (self.max == 0 ? self.fifo.length : self.max);

        let currentItem = self.fifo.shift();

        if (currentItem) {
            self.currentStep += 1;

            //If the user passed a repporting function, call it
            if (self.reportFunction) {
                self.reportFunction(self.currentStep, self.max);
            }

            if (currentItem.message !== "") {
                applog.LogInfo(currentItem.message);
            }

            currentItem.function(...currentItem.params);
        } else {
            applog.LogInfo("Process finished");
            self.completeFunction();
        }
    }

    return self;
}