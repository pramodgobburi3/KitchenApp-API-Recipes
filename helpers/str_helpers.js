'use strict';

module.exports = {
  toTitleCase: function (str) {
    // https://gomakethings.com/converting-a-string-to-title-case-with-vanilla-javascript/
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
    }
}