define([], function () {
  return class Settings {
    constructor(widget) {
      this.widget = widget;
    }

    /**
     * Saves the settings from the form.
     * @param {Object} evt - The event object containing the active status and custom fields.
     * @returns {Promise} - A promise that resolves with the saved settings data or an indication to reinstall.
     */
    save(evt) {
      let _this = this;
      let code = _this.widget.params.widget_code;
      let isActive = false;
      let params =
        (
          $(
            "#" + _this.widget.config.prefix + "-settings__form"
          ).serializeJSON() || {}
        ).params || {};

      return new Promise(function (resolve, reject) {
        // Determine if the widget is active
        isActive = evt.active === "Y";

        let data = {
          is_active: isActive,
        };

        // Check if already installed
        let installed = ((_this.widget.params || {}).active || "N") === "Y";
        // Resolve with an indication to reinstall if not installed
        if (!installed) {
          resolve({ reinstall: true });
        }

        if (isActive) {
          if (!_this.widget.validateSettings(params)) {
            // Trigger save error if validation fails
            $(".modal." + code)
              .find(".js-widget-save")
              .trigger("button:save:error");

            // Reject the promise due to validation error
            reject();
          } else {
            // Add parameters to data if validation is successful
            data.params = params;
          }
        }

        // Update widget info with new settings
        _this.widget.info = data;
        // Update custom fields
        evt.fields.custom = JSON.stringify(params);
        resolve(data);
      }).then(function () {
        // Return true after successful save
        return true;
      });
    }

    /**
     * Loads the settings from the widget.
     * @returns {Promise} - A promise that resolves with an empty array after loading settings.
     */
    load() {
      let _this = this;
      return new Promise((resolve, reject) => {
        // Initialize settings with custom parameters or an empty object
        _this.widget.info.params = (_this.widget.params || {}).custom || {};
        if (typeof _this.widget.info.params === "string") {
          _this.widget.info.params = JSON.parse(_this.widget.info.params);
        }
        // Default templates to empty string if not defined
        if (!_this.widget.info.params.templates) {
          _this.widget.info.params.templates = "";
        }
        resolve([]);
      });
    }
  };
});
