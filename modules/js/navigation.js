(function() {

    window.stauchen = window.stauchen || {};

    function getQueryParams(queryString) {
        var query = (queryString || window.location.hash).substring(1); // delete #
        if (!query) {
          return {};
        }
        return _
        .chain(query.split('&'))
        .map(function(params) {
          var p = params.split('=');
          return [p[0], decodeURIComponent(p[1])];
        })
        .object()
        .value()
    }

    window.stauchen.start = function () {
        var startTag = getQueryParams().startTag || "start";
        console.log("Looking for passage tagged ", startTag);
        _(story.passages).each(function (passage) {
            if (passage && passage.tags && passage.tags.includes(startTag)) {
                console.log("Found tag ", startTag, " in passage ", passage.name);
                story.show(passage.name);
            }
        });
    };
}());