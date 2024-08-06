define([], function () {
  return class Loader {
    /**
     * Creates an instance of the Loader class.
     * @param {Object} widget - The widget object containing configuration and templates.
     */
    constructor(widget) {
      let _this = this;
      _this.templates = widget.templates;
      _this.langs = widget.langs;
      _this.html = "";
      _this.widget = widget;
    }

    /**
     * Prepends the loader HTML to the specified element (widget settings before primary template).
     * @param {jQuery} elem - The jQuery element to which the loader will be prepended.
     * @returns {Loader} The current Loader instance.
     */
    prepend(elem) {
      elem.prepend(this.getHtml());
      return this;
    }

    /**
     * Appends the loader HTML to the specified element (widget settings before primary template).
     * @param {jQuery} elem - The jQuery element to which the loader will be appended.
     * @returns {Loader} The current Loader instance.
     */
    append(elem) {
      elem.append(this.getHtml());
      return this;
    }

    /**
     * Retrieves the HTML for the loader, rendering it if necessary.
     * @returns {string} The HTML string for the loader.
     */
    getHtml() {
      let _this = this;
      if (_this.html.length === 0) {
        _this.html = _this.templates.render("loader", {
          widget: _this.langs.widget.name,
          icons: _this.widget.config.icons,
        });
      }

      return _this.html;
    }

    /**
     * Hides the loader element.
     * @returns {Loader} The current Loader instance.
     */
    hide() {
      return $(".kommo-loader").hide();
    }

    /**
     * Shows the loader element.
     * @returns {Loader} The current Loader instance.
     */
    show() {
      $(".kommo-loader").show();
      return this;
    }

    /**
     * Removes the loader element from the DOM.
     * @returns {Loader} The current Loader instance.
     */
    remove() {
      $(".kommo-loader").remove();
      return this;
    }

    /**
     * Displays the "Save" button in a modal dialog.
     * @param {string} code - The code of the modal dialog where the button will be displayed.
     * @returns {Loader} The current Loader instance.
     */
    displaySaveBtn(code) {
      $(".modal." + code)
        .find(".widget_settings_block__controls")
        .show();
      return this;
    }
  };
});
