'use strict';

module.exports = {
  name: require('./package').name,
  included(app) {
    this._super.included.apply(this, arguments);
  },

  isDevelopingAddon() {
    return true;
  }
};