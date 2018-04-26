// Payment Info Component
// Based on: https://github.com/zdfs/toscani/
// Modified by: https://github.com/wchavarria03/toscani
// Requires: jQuery, jQuery.inputmask

(function ($) {

  "use strict";

  $.fn.paymentInfo = function (method) {

    // Global variables.
    var methods,
      helpers,
      events,
      ccDefinitions,
      opts,
      pluginName = "paymentInfo";

    // Events map for the matchNumbers() function.
    events = $.map(['change', 'blur', 'keyup'], function (v) {
      return v + '.' + pluginName;
    }).join(' ');

    // Credit card regex patterns.
    ccDefinitions = {
      'visa': /^4/,
      'mc': /^5[0-5]/,
      'amex': /^3(4|7)/,
      'disc': /^6(011|22|4|5)/,

      'diner': /^3(6|8|9|00|01|02|03|04|05|09)/,
      // 'enroute': /^2(014|149)/,
      'jcb': /^35/,
    };

    helpers = {
      addFieldError: function ($field) {
        $field.removeClass('invalid');
      },
      addGroupError: function () {
        $('.' + opts.fieldsetClass).addClass('invalid');
      },
      cleanOthersFieldValues: function () {
        $("." + opts.fieldsetClass)
          .find("input:gt(0)")
          .val("");
      },
      cleanStoredCCNumber: function () {
        $('.' + opts.cardNumberClass).data("ccNumber", "");
      },
      displayOtherFields: function () {
        $("." + opts.fieldsetClass)
          .find("input:gt(0)")
          .removeClass("hide");
      },
      getCreditCardType: function (number) {
        var ccType;
        $.each(ccDefinitions, function (i, v) {
          if (v.test(number)) {
            ccType = i;
            return false;
          }
        });
        return ccType;
      },
      removeFieldError: function ($field) {
        $field.removeClass('invalid');
      },
      removeGroupError: function () {
        $('.' + opts.fieldsetClass).removeClass('invalid');
      },
      resetCCFieldMask: function (el, ccType) {
        if (ccType === "amex") {
          el.inputmask({ mask: "9999 999999 99999"});
          $("." + opts.cardCvvClass).inputmask({ mask: "9999", oncomplete: helpers.cvvComplete });
        } else {
          el.inputmask({ mask: "9999 9999 9999 9999"});
          $("." + opts.cardCvvClass).inputmask({ mask: "999", oncomplete: helpers.cvvComplete });
        }
      },
      setCardImage: function (ccType) {
        if (ccType) {
          $("." + opts.cardImageClass)
            .removeClass('invalid')
            .addClass(ccType);
          return;
        }
        //reset card-image to default if not cctype
        $("." + opts.cardImageClass)
            .removeClass()
            .addClass(opts.cardImageClass);
      },
      setInvalidCardImage: function () {
        $('.' +  opts.cardImageClass)
          .addClass('invalid');
      },
      matchNumbers: function (el) {
        var cardNumber = el.data("ccNumber") || el.val(),
        // var cardNumber = el.data("ccNumber") || element.inputmask("unmaskedvalue"),
          ccType = helpers.getCreditCardType(cardNumber),
          creditCardUnmasked = cardNumber.replace(/\s/g, ''),
          ccLength = cardNumber.length;

        if (cardNumber !== "") {
          helpers.resetCCFieldMask(el, ccType);
          if ((ccType === "amex" && ccLength === 15) || (ccType !== "amex" && ccLength === 16)) {
            if (helpers.ccLuhnCheck(creditCardUnmasked)) {
              // Remove group error
              helpers.removeGroupError();
              // Remove field error
              helpers.removeFieldError();
              // Set valid card-image
              helpers.setCardImage(ccType);
              // Call creditCardComplete
              helpers.creditCardComplete();
            } else {
              // Display group error
              helpers.addGroupError();
              // Display field error
              helpers.addFieldError(el);
              // Set invalid card-image error
              helpers.setInvalidCardImage();
            }
          } else {
            // Remove group error
            helpers.removeGroupError();
            // Remove field error
            helpers.removeFieldError();
            // Set valid card-image
            helpers.setCardImage(ccType);
          }
        } else {
          // Remove group error
          helpers.removeGroupError();
          // Remove field error
          helpers.removeFieldError(ele);
          // Set default card-image
          helpers.setCardImage();
          // Clean stored cc number
          helpers.cleanStoredCCNumber();
          // Clean other fields values
          helpers.cleanOthersFieldValues();
        }
      },
      creditCardComplete: function () {
        var element = $("." + opts.cardNumberClass),
          uvalue = element.inputmask("unmaskedvalue"),
          ccType = helpers.getCreditCardType(uvalue);

        /*
          // Let's make sure the card is valid
          if (ccType === undefined) {
            $(element)
              .parents("." + opts.fieldsetClass);
            return;
          }
        */

        if(!ccType || !helpers.ccLuhnCheck(uvalue)) {
          // Add group error
          // Add field error
          // Set invalid card-image
          return;
        }

        /*
          // Let's make sure the number entered checks against the Luhn Algorithm
          if (helpers.ccLuhnCheck(uvalue) === false) {
            $(element)
              .addClass('invalid')
              .siblings('.card-image')
              .removeClass('valid');

              $('.' +  opts.cardImageClass)
                .removeClass()
                .addClass(opts.cardImageClass + ' invalid');
              $('.' + opts.fieldsetClass)
                .addClass('invalid');
            return;
          }

          $(element)
          .removeClass('invalid');
        */

        // Replace with last four digits of the cc
        element.bind("saveValues", function () {
          if ((ccType === "amex" && uvalue.length === 15) || (ccType !== "amex" && uvalue.length === 16)) {
            element
              .data("ccNumber", uvalue)
              .val(uvalue.substr(uvalue.length - 4, uvalue.length));
          }
        });


        // Add transition class
        element.addClass("transitioning-out");

        // We have to set a timeout so that we give our animations time to finish. We have to
        // blur the element as well to fix a bug where our credit card field was losing its
        // value prematurely.
        // Verify this code Walter //
        setTimeout(function () {
          element.removeClass("transitioning-out");
          element.bind("blur", function () {
            element.trigger("saveValues");
          }).blur();
          element.addClass("full");
        }, opts.animationWait);

        setTimeout(function () {
          helpers.displayOtherFields();
        }, opts.animationWait);

        // Get back to full CC
        $(element)
          .unbind("blur focus click keyup keypress")
          .bind("focus click keyup", function (e) {
            if (e.type === "focus" || e.type === "click" || (e.shiftKey && e.keyCode === 9)) {
              helpers.getBackToFullCCNumber($(element));
            }
          });

        // Focus credit card expiration input
        setTimeout(function () {
          $("#" + opts.cardExpirationClass).focus().val($.trim($("." + opts.cardExpirationClass).val()));
        }, opts.focusDelay);
        
      },

      // status: valid=true, invalid=false
      setFieldStatus: function ($field, status) {
        var status = status === true ? 'valid' : 'invalid';
        $("." + opts.fieldsetClass)
          .removeClass('invalid valid')
          .addClass(status);
        
        $field
          .removeClass('invalid valid')
          .addClass(status);
      },

      isValidDate: function (val) {
        var dateArray = val.split('/');
        if (dateArray.length !== 2) {
          return false;
        }
        var month = dateArray[0];
        var year = dateArray[1];

        if ((parseInt(month) > 1  && parseInt(month) < (13)) || (parseInt(year) > 18  && parseInt(year) < 50)) {
          return true;
        }
        return false;
      },

      expirationComplete: function () {
        if (!helpers.isValidDate($(this).val())) {
          var isValid = false;
          helpers.setFieldStatus($("." + opts.cardExpirationClass), isValid);
        }

        $("." + opts.cardExpirationClass)
          .addClass("full")
          .unbind("keyup blur")
          .bind("keyup", function (e) {
            if (e.keyCode === 8 && $(this).val() === "") {
              $(this).removeClass("full");
              $("." + opts.cardNumberClass).focus();
            }
          });
        setTimeout(function () {
          $("." + opts.cardCvvClass).focus();
        }, opts.focusDelay);

      },

      cvvComplete: function () {
        $("." + opts.cardCvvClass)
          .addClass("full")
          .unbind("keyup blur")
          .bind("keyup", function (e) {
            if (e.keyCode === 8 || e.keyCode === 9) {
              if ($(this).val() === "") {
                $(this).removeClass("full");
                $("." + opts.cardExpirationClass).focus();
              }
            }
          });

          // Focus credit card expiration input.
          $("." + opts.cardZipClass).focus();
      },

      zipComplete: function () {
        $("." + opts.cardZipClass)
          .addClass("full")
          .unbind("keyup blur")
          .bind("keyup", function (e) {
            if (e.keyCode === 8 && $(this).val() === "") {
              $(this).removeClass("full");
              $("." + opts.cardCvvClass).focus();
            }
          }).inputmask({ mask: "99999" });

        $("." + opts.fieldsetClass).addClass('valid');
      },

      // This function allows us to edit the credit card number once it's been entered.
      getBackToFullCCNumber: function (element) {
        // Set the value of the field to the original card number and apply our
        // transition state.
        $(element)
          .val($(element).data("ccNumber"))
          .addClass("transitioning-in");
        // Wait for the animation to complete and then remove our classes.
        setTimeout(function () {
          element.removeClass("transitioning-in full");
        }, 150);

        // Hide the extraneous inputs until the credit card is filled out again.
        // Verify this code Walter //
        $("." + opts.fieldsetClass)
          .find("input:gt(0)")
          .addClass("hide");
      },

			// Luhn algorithm in JavaScript: validate credit card number supplied as string of numbers with a checksum
      ccLuhnCheck: (function (arr) {
        return function (ccNum) {
          var
            len = ccNum.length,
            bit = 1,
            sum = 0,
            val;

          while (len) {
            val = parseInt(ccNum.charAt(--len), 10);
            sum += (bit ^= 1) ? arr[val] : val;
          }

          return sum && sum % 10 === 0;
        };
      }([0, 2, 4, 6, 8, 1, 3, 5, 7, 9]))
    };

    methods = {
      init: function (options) {
        // Get a copy of our configuration options
        opts = $.extend({}, $.fn.paymentInfo.defaults, options);

        // Configure the jQuery.inputmask plugin
        $.extend($.inputmask.defaults, {
          placeholder: " ",
          showMaskOnHover: false,
          overrideFocus: true
        });

        // Loop through our fieldset, find our inputs and initialize them.
        return this.each(function () {
          $(this)
            .find("label")
            .addClass("hide")
            .end()
            .find("." + opts.cardNumberClass)
            .inputmask({ mask: "9999 9999 9999 9999" })
            .before("<span class='" + opts.cardImageClass + "'></span>")
            .end()
            .find("." + opts.cardExpirationClass)
            .inputmask({ mask: "99/99", oncomplete: helpers.expirationComplete })
            .addClass("hide")
            .end()
            .find("." + opts.cardCvvClass)
            .inputmask({ mask: "999" })
            .addClass("hide")
            .end()
            .find("." + opts.cardZipClass)
            .inputmask({ mask: "99999", oncomplete: helpers.zipComplete })
            .addClass("hide")
            .end();

          helpers.matchNumbers($(this).find("." + opts.cardNumberClass).eq(0));
        }).unbind('.' + pluginName).bind(events, function () {
          helpers.matchNumbers($(this).find("." + opts.cardNumberClass).eq(0));
        });
      },
    };
    return methods.init.apply(this, arguments);
  };

  // Plugin config options.
  $.fn.paymentInfo.defaults = {
    fieldsetClass: "credit-card-group",
    cardImageClass: "card-image",
    cardCvvClass: "card-cvv",
    cardExpirationClass: "card-expiration",
    cardZipClass: "card-zip",
    cardNumberClass: "card-number",
    animationWait: 500,
    focusDelay: 600,
  };

}(jQuery));

$(".credit-card-group").paymentInfo();