(function () {

    window.Log = {
        log: function () {
            console.log.apply(console, arguments);
        },

        debug: function () {
            if (query.debug) {
                console.log.apply(console, arguments);
            }
        },

        error: function () {
            console.error.apply(console, arguments);
        }
    }

}());