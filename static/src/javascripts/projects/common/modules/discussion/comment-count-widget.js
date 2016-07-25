/* globals guardian */
define([
    'comment-count',
    'common/utils/get-property',
    'fastdom',
    'common/modules/experiments/ab',
    'common/modules/experiments/tests/utils/comment-blocker',
    'common/utils/assign',
    'common/utils/formatters',
    'common/utils/mediator',
    'common/utils/report-error'
], function (
    commentCountWidget,
    getProperty,
    fastdom,
    ab,
    CommentBlocker,
    assign,
    formatters,
    mediator,
    reportError
) {
    function remove (node) {
        // Comment count widgets are inside a <a> tag
        const container = node.parentNode;
        fastdom.write(function () {
            // because Node.remove() doesn't exist on IE
            container.parentNode.removeChild(container);
        });
    }

    function init(overrideConfig, overrideAB, overrideBlocker) {
        var abtest = overrideAB || ab;
        var blocker = overrideBlocker || CommentBlocker;
        var widgetConfig = assign({
            apiBase: getProperty(guardian, 'config.page.ajaxUrl') + '/discussion/comment-counts.json',
            apiQuery: 'shortUrls',
            filter: function (node) {
                var shortUrl = node.getAttribute('data-loyalty-short-url');
                if (shortUrl && abtest.isInVariant('ParticipationDiscussionTest', 'variant-1') && blocker.hideComments(shortUrl.replace('/p/','')) ) {
                    remove(node);
                    return false;
                }
                return true;
            },
            onupdate: function (node, count) {
                if (count === 0 && node.getAttribute('data-discussion-closed') === 'true') {
                    remove(node);
                }
            },
            format: formatters.integerCommas
        }, overrideConfig);

        //Load new counts when more trails are loaded
        mediator.on('modules:related:loaded', function () {
            commentCountWidget.update(widgetConfig)
            .then(function () {
                mediator.emit('modules:commentcount:loaded');
            })
            .catch(report);
        });

        return commentCountWidget.load(widgetConfig)
        .then(function () {
            mediator.emit('modules:commentcount:loaded');
        })
        .catch(report);
    }

    function report (error) {
        reportError(error, {
            feature: 'comment-count'
        }, false);
    }

    return {
        init: init
    };
});
