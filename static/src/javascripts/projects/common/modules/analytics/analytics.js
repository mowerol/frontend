/* eslint-disable no-empty, no-undef */
//This uses the named module pattern : https://github.com/umdjs/umd/blob/master/templates/amdWebGlobal.js

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('analytics', function () {
            return (root.analytics = factory());
        });
    } else {
        root.analytics = factory();
    }
}(this, function () {

    var trackNavigationInteraction = function(ni) {
        var d = new Date().getTime();
        if (d - ni.time < 60 * 1000) { // One minute
            s.eVar24 = ni.pageName;
            s.eVar37 = ni.tag;
        }
    };

    var getSponsoredContentTrackingData = function(content) {
        var sponsoredContentData = content.map(function(n) {
            var sponsorshipType = n.getAttribute('data-sponsorship');
            var maybeSponsor = n.getAttribute('data-sponsor');
            var sponsor = maybeSponsor ? maybeSponsor : 'unknown';
            return sponsorshipType + ':' + sponsor;
        });
        return sponsoredContentData.filter(
            function filterDuplicates(value, index, self) {
                return self.indexOf(value) === index;
            }
        );
    };

    try {

        var config  = guardian.config,
            isEmbed = !!guardian.isEmbed,
            tpA     = s.getTimeParting('n', '+0'),
            now     = new Date(),
            webPublicationDate = config.page.webPublicationDate;

        var NG_STORAGE_KEY = 'gu.analytics.referrerVars';

        var getChannel = function () {
            if (config.page.contentType === 'Network Front') {
                return 'Network Front';
            } else if (isEmbed) {
                return 'Embedded';
            }
            return config.page.section || '';
        };

        /* http://www.electrictoolbox.com/pad-number-zeroes-javascript/ */
        var pad = function (number, length) {
            var str = '' + number;
            while (str.length < length) {
                str = '0' + str;
            }
            return str;
        };

        s.trackingServer = 'hits.theguardian.com';
        s.trackingServerSecure = 'hits-secure.theguardian.com';
        s.ssl = true;

        /* Omniture library version */
        s.prop62    = 'Guardian JS-1.4.1 20140914';

        // http://www.scribd.com/doc/42029685/15/cookieDomainPeriods
        s.cookieDomainPeriods = '2';

        s.linkInternalFilters += ',localhost,gucode.co.uk,gucode.com,guardiannews.com,int.gnl,proxylocal.com,theguardian.com';

        s.ce = 'UTF-8';
        s.pageName  = config.page.analyticsName;

        s.prop1     = config.page.headline || '';

        s.prop3     = config.page.publication || '';

        s.prop6     = config.page.author || '';

        s.prop13    = config.page.seriesTags || '';

        // getting clientWidth causes a reflow, so avoid using if possible
        s.eVar21    = (window.innerWidth || document.documentElement.clientWidth)
            + 'x'
            + (window.innerHeight || document.documentElement.clientHeight);

        s.prop4     = config.page.keywords || '';
        s.prop8     = config.page.pageCode || '';
        s.prop9     = config.page.contentType || '';
        // Previous Content type
        s.prop70    = s.getPreviousValue(s.prop9, 's_prev_ct');
        s.prop10    = config.page.tones || '';
        s.prop5     = config.page.trackingNames || '';

        s.prop25    = config.page.blogs || '';

        s.channel   = getChannel();

        if (isEmbed) {
            s.eVar11 = s.prop11 = 'Embedded';

            // Get iframe's parent url: http://www.nczonline.net/blog/2013/04/16/getting-the-url-of-an-iframes-parent
            if (!!window.parent && window.parent !== window) {
                s.referrer = document.referrer;
            }
        }

        if (config.page.commentable) {
            s.events = s.apl(s.events, 'event46', ',');
        }

        if (config.page.section === 'identity')  {
            s.prop11 = 'Users';
            s.prop9 = 'userid';
            s.eVar27 = config.page.omnitureErrorMessage || '';
            s.eVar42 = config.page.returnUrl || '';
            s.hier2 = 'GU/Users/Registration';
            s.events = s.apl(s.events, config.page.omnitureEvent, ',');
        }

        // not all pages have a production office
        if (config.page.productionOffice) {
            s.prop64 = config.page.productionOffice;
        }

        s.prop65    = config.page.headline || '';
        s.eVar70    = config.page.headline || '';

        if (s.getParamValue('INTCMP') !== '') {
            s.eVar50 = s.getParamValue('INTCMP');
        }
        s.eVar50 = s.getValOnce(s.eVar50, 's_intcampaign', 0);

        // the operating system
        s.eVar58 = navigator.platform || 'unknown';

        // the number of Guardian links inside the body
        if (config.page.inBodyInternalLinkCount) {
            s.prop58 = config.page.inBodyInternalLinkCount;
        }

        // the number of External links inside the body
        if (config.page.inBodyExternalLinkCount) {
            s.prop69 = config.page.inBodyExternalLinkCount;
        }

        s.prop75 = config.page.wordCount || 0;
        s.eVar75 = config.page.wordCount || 0;

        s.prop19 = 'frontend';
        s.prop67    = 'nextgen-served';

        // Set Page View Event
        s.events    = s.apl(s.events, 'event4', ',', 2);

        s.prop56    = guardian.isEnhanced ? 'Javascript' : 'Partial Javascript';

        /* Set Time Parting Day and Hour Combination - 0 = GMT */
        s.prop20    = tpA[2] + ':' + tpA[1];
        s.eVar20    = 'D=c20';

        /*
         eVar1 contains today's date
         in the Omniture backend it only ever holds the first
         value a user gets, so in effect it is the first time
         we saw this user
         */
        s.eVar1 = now.getFullYear() + '/' + pad(now.getMonth() + 1, 2) + '/' + pad(now.getDate(), 2);

        s.prop7     = webPublicationDate ? new Date(webPublicationDate).toISOString().substr(0, 10).replace(/-/g, '/') : '';

        if (webPublicationDate) {
            s.prop30 = 'content';
        } else {
            s.prop30 = 'non-content';
        }

        s.prop47    = config.page.edition || '';

        var userFromCookie = window.guardian.config.user;

        if (userFromCookie) {
            s.prop2 = 'GUID:' + userFromCookie.id;
            s.eVar2 = 'GUID:' + userFromCookie.id;
        }

        s.prop31    = userFromCookie ? 'registered user' : 'guest user';
        s.eVar31    = userFromCookie ? 'registered user' : 'guest user';

        try {
            var navInteractionData = window.sessionStorage.getItem(NG_STORAGE_KEY);

            var navInteraction = JSON.parse(navInteractionData);

            if (navInteraction) {
                trackNavigationInteraction(navInteraction.value);
                window.sessionStorage.removeItem(NG_STORAGE_KEY);
            }

        } catch (e) { }

        // Sponsored content
        if(window.guardian.isModernBrowser) {
            var contentNodes = document.querySelectorAll('[data-sponsorship]');
            var sponsoredContentArray = Array.prototype.slice.call(contentNodes);
            s.prop38 = getSponsoredContentTrackingData(sponsoredContentArray);
        }

        /*
         this makes the call to Omniture.
         `s.t()` records a page view so should only be called once
         */

        s.t();

        var checkForPageViewInterval = setInterval(function () {
            /*
             s_i_guardiangu-network is a globally defined Image() object created by Omniture
             It does not sit in the DOM tree, and seems to be the only surefire way
             to check if the intial beacon has been successfully sent
             */
            var img = window['s_i_' + window.s_account.split(',').join('_')];
            if (typeof (img) !== 'undefined' && (img.complete === true || img.width + img.height > 0)) {
                clearInterval(checkForPageViewInterval);

                var pageView = new Image();
                pageView.src = guardian.config.page.beaconUrl + '/count/pva.gif';

            }
        }, 100);

        // Give up after 10 seconds
        setTimeout(function () {
            clearInterval(checkForPageViewInterval);
        }, 10000);
    } catch(e) {
        (new Image()).src = guardian.config.page.beaconUrl + '/count/omniture-pageview-error.gif';
    }

    // in lieu of a build step that would enable these to be seperate modules
    // these are exported for testing
    
    return {
        'test': {
            'getSponsoredContentTrackingData': getSponsoredContentTrackingData,
            'trackNavigationInteraction': trackNavigationInteraction
        }
    };
}));
