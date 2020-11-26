(function() {

    window.navigation = window.navigation || {};



    window.navigation.start = function () {
        var startTag = window.query.startTag || "start";
        window.Log.debug("Looking for passage tagged ", startTag);
        _(story.passages).each(function (passage) {
            if (passage && passage.tags && passage.tags.includes(startTag)) {
                window.Log.debug("Found tag ", startTag, " in passage ", passage.name);
                story.show(passage.name);
            }
        });
    };
}());