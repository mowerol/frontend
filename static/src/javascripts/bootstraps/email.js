define([
    'common/utils/formInlineLabels',
    'bean',
    'qwery',
    'common/utils/$',
    'common/utils/ajax-promise',
    'common/utils/config',
    'fastdom',
    'Promise',
    'common/utils/mediator',
    'lodash/functions/debounce',
    'lodash/collections/contains',
    'common/utils/template',
    'common/views/svgs',
    'text!common/views/email/submissionResponse.html',
    'common/utils/detect'
], function (
    formInlineLabels,
    bean,
    qwery,
    $,
    ajax,
    config,
    fastdom,
    Promise,
    mediator,
    debounce,
    contains,
    template,
    svgs,
    successHtml,
    detect
) {

    function handleSubmit(isSuccess, $form) {
        return function () {
            updateForm.replaceContent(isSuccess, $form);
            state.submitting = false;
        };
    }

    function postMessageToParent(message) {
        return new Promise(function (resolve) {

            // We only want to post messages when the iframe is embedded on the same host
            if (parent.location.host === window.location.host) {
                parent.postMessage(message, parent.location.href);
                console.log('Posting to parent ', message)
            } else {

            }
            return resolve({type: 'success', data: 'Posted to omniture'})
        });
    }

    bean.on(window, 'onmessage message', function(event){
        var messageOrigin = event.origin.replace(/.*?:\/\//g, "");
        console.log('email message origin', messageOrigin)
        if (messageOrigin === window.location.host) {
            console.log(event);
            if (event.data.type !== 'success') {
                event.source.postMessage({type: 'success', data: 'hello'}, '//' + messageOrigin)
            }
        }
    });

    var state = {
            submitting: false
        },
        classes = {
            wrapper: 'js-email-sub',
            form: 'js-email-sub__form',
            inlineLabel: 'js-email-sub__inline-label',
            textInput: 'js-email-sub__text-input',
            listIdHiddenInput: 'js-email-sub__listid-input'
        },
        setup = function () {
            var $el = $('.' + classes.wrapper),
                freezeHeight = ui.freezeHeight($el, false),
                freezeHeightReset = ui.freezeHeight($el, true),
                $formEl = $('.' + classes.form);

            formInlineLabels.init($('.' + classes.inlineLabel), {
                textInputClass: '.js-email-sub__text-input',
                labelClass: '.js-email-sub__label',
                hiddenLabelClass: 'email-sub__label--is-hidden',
                labelEnabledClass: 'email-sub__inline-label--enabled'
            });

            formSubmission.bindSubmit($formEl, {
                formType: $formEl.data('email-form-type'),
                listId: $formEl.data('email-list-id')
            });

            // Ensure our form is the right height
            freezeHeight.call();

            mediator.on('window:resize',
                debounce(freezeHeightReset, 500)
            );

        },
        formSubmission = {
            bindSubmit: function ($form, analytics) {
                var url = '/email';
                bean.on($form[0], 'submit', this.submitForm($form, url, analytics));
            },
            submitForm: function ($form, url, analytics) {
                /**
                 * simplistic email address validation to prevent misfired
                 * omniture events
                 *
                 * @param  {String} emailAddress
                 * @return {Boolean}
                 */
                function validate(emailAddress) {
                    return typeof emailAddress === 'string' &&
                        emailAddress.indexOf('@') > -1;
                }

                return function (event) {
                    var emailAddress = $('.' + classes.textInput, $form).val(),
                        listId = $('.' + classes.listIdHiddenInput, $form).val();

                    event.preventDefault();

                    if (!state.submitting && validate(emailAddress)) {
                        var formData = $form.data(),
                            data =  'email=' + encodeURIComponent(emailAddress) +
                                '&listId=' + listId +
                                '&campaignCode=' + formData.campaignCode || '' +
                                '&referrer=' + formData.referrer || '';

                        state.submitting = true;

                        postMessageToParent({
                            type: 'omniture',
                            data: 'rtrt | email form inline | ' + analytics.formType + ' | ' + analytics.listId + ' | subscribe clicked'
                        });

                        ajax({
                            url: url,
                            method: 'post',
                            data: data,
                            headers: {
                                'Accept': 'application/json'
                            }
                        })
                        .then(postMessageToParent({
                            type: 'omniture',
                            data: 'rtrt | email form inline | ' + analytics.formType + ' | ' + analytics.listId + ' | subscribe successful'
                        }))
                        .then(handleSubmit(true, $form))
                        .catch(function (error) {
                            // robust.log('c-email', error); Move to parent
                            postMessageToParent({
                                type: 'omniture',
                                data: 'rtrt | email form inline | ' + analytics.formType + ' | ' + analytics.listId + ' | error'
                            });
                            handleSubmit(false, $form)();
                        });

                    }
                };
            }
        },
        updateForm = {
            replaceContent: function (isSuccess, $form) {
                var submissionMessage = {
                        statusClass: (isSuccess) ? 'email-sub__message--success' : 'email-sub__message--failure',
                        submissionHeadline: (isSuccess) ? 'Thank you for subscribing' : 'Something went wrong',
                        submissionMessage: (isSuccess) ? 'We will send you our picks of the most important headlines tomorrow morning.' : 'Please try again.',
                        submissionIcon: (isSuccess) ? svgs('tick') : svgs('crossIcon')
                    },
                    submissionHtml = template(successHtml, submissionMessage);

                fastdom.write(function () {
                    $form.addClass('email-sub__form--is-hidden');
                    $form.after(submissionHtml);
                });
            }
        },
        ui = {
            updateForm: function (opts) {
                var formTitle = (opts && opts.formTitle) || false,
                    formDescription = (opts && opts.formDescription) || false,
                    formCampaignCode = (opts && opts.formCampaignCode) || '',
                    removeComforter = (opts && opts.removeComforter) || false;

                fastdom.write(function () {
                    if (formTitle) {
                        $('.js-email-sub__heading').text(formTitle);
                    }

                    if (formDescription) {
                        $('.js-email-sub__description').text(formDescription);
                    }

                    if (removeComforter) {
                        $('.js-email-sub__small').remove();
                    }
                });

                // Cache data on the form element
                $('.js-email-sub__form').data('formData', {
                    campaignCode: formCampaignCode,
                    referrer: window.location.href
                });

            },
            freezeHeight: function ($wrapper, reset) {
                var wrapperHeight,
                    resetHeight = function () {
                        fastdom.write(function () {
                            $wrapper.css('min-height', '');
                            getHeight();
                            setHeight();
                        });
                    },
                    getHeight = function () {
                        fastdom.read(function () {
                            wrapperHeight = $wrapper[0].clientHeight;
                        });
                    },
                    setHeight = function () {
                        fastdom.defer(function () {
                            $wrapper.css('min-height', wrapperHeight);
                        });
                    };

                return function () {
                    if (reset) {
                        resetHeight();
                    } else {
                        getHeight();
                        setHeight();
                    }
                };
            }
        };

    setup()

    ui.updateForm({
        formTitle: 'hey there title',
        formDescription: 'description',

    })
});