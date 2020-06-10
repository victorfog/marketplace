function logEvents(instance) {
    instance.allEvents(function(error, log){
        if (!error)
            console.log(log);
    });
}

module.exports.logEvents=logEvents;