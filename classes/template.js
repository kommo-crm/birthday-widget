define(["jquery", "lib/components/base/modal", "twigjs", "text"], function (
  $,
  Modal,
  twig,
  text
) {
  return class Templates {
    constructor(widget) {
      this.widget = widget;
      this.templates = widget.config.templates || {};
      // Container for compiled templates
      this.templates.html = {};
      // CSS files configuration
      this.css = widget.config.css;
      this.textSavedXhr = text.useXhr;
    }

    /**
     * Set text plugin to use XHR.
     */
    flushTextPlugin() {
      text.useXhr = function () {
        return true;
      };
    }

    /**
     * Restore the original state of the text plugin XHR.
     */
    restoreTextPlugin() {
      text.useXhr = this.textSavedXhr;
    }

    /**
     * Check if a template is already registered in the Twig registry.
     * @param {string} name - The name of the template.
     * @returns {boolean} - Whether the template is registered.
     */
    checkRegistry(name) {
      let id = "kommo_bd_" + name;
      return !!(Twig.Templates || {}).registry[id];
    }

    /**
     * Get a template from the Twig registry.
     * @param {string} name - The name of the template.
     * @returns {string} - The template content.
     */
    getFromRegistry(name) {
      let id = "kommo_bd_" + name;
      return (Twig.Templates || {}).registry[id] || "";
    }

    /**
     * Preload CSS and template files.
     * @returns {Promise} - A promise that resolves when both CSS and templates are loaded.
     */
    preload() {
      return Promise.all([this.loadCss(), this.loadTemplates()]);
    }

    /**
     * Load template files and compile them.
     * @returns {Promise} - A promise that resolves when all templates are loaded.
     */
    loadTemplates() {
      let _this = this;
      return new Promise(function (resolve) {
        // Determine the area for templates
        let area = APP.widgets.system.area;
        // Get templates for the area
        let templates = _this.templates.params[area] || [];
        // Set text plugin to use XHR
        _this.flushTextPlugin();
        if (templates.length > 0) {
          let load = [];
          let ids = [];
          templates.forEach(function (template) {
            if (template.id.indexOf(_this.widget.config.code) === -1) {
              // Prefix template ID
              template.id = _this.widget.config.code + "_" + template.id;
            }

            if (!template.url) {
              // Construct URL for template
              template.url =
                _this.widget.params.path +
                "/assets/templates" +
                template.path +
                ".twig?v=" +
                _this.widget.get_version();
            }

            if (!_this.checkRegistry(template.id)) {
              // Collect URLs for loading
              load.push("text!" + template.url);
              // Collect IDs for templates
              ids.push(template.id);
            } else {
              // Get template from registry
              _this.templates.html[template.id] = _this.getFromRegistry(
                template.id
              );
            }
          });

          if (load.length > 0) {
            require(load, function () {
              for (let i = 0; i < arguments.length; i++) {
                // Add loaded templates
                _this.addTemplate(ids[i], arguments[i]);
              }
              resolve();
            });
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      });
    }

    /**
     * Add a template to the compiled templates.
     * @param {string} name - The name of the template.
     * @param {string} data - The template content.
     */
    addTemplate(name, data) {
      let id = "kommo_bd_" + name;
      if (this.checkRegistry(name)) {
        this.templates.html[name] = Twig.Templates.registry[id];
        return;
      }

      this.templates.html[name] = twig({
        id: id,
        data: data,
        allowInlineIncludes: true,
      });
    }

    /**
     * Load CSS files.
     * @returns {Promise} - A promise that resolves when all CSS files are loaded.
     */
    loadCss() {
      let _this = this;
      return new Promise(function (resolve) {
        let html = "";
        _this.css.forEach((file) => {
          let $style = null;
          // Construct URL for CSS file
          let path =
            _this.widget.params.path +
            "/assets/css/" +
            file.name +
            ".css?v=" +
            _this.widget.params.version;
          if (file.append_id) {
            // Get existing style tag by ID
            $style = $("#" + file.append_id);
          } else {
            // Get existing link tag by URL
            $style = $('link[href="' + path + '"]');
          }

          if ($style.length < 1) {
            html +=
              '<link type="text/css" rel="stylesheet" href="' + path + '"';
            if (file.append_id) {
              // Add ID if specified
              html += ' id="' + file.append_id + '"';
            }
            html += ">";
          }
        });

        if (html.length > 0) {
          // Append CSS to the head
          $("head").append(html);
        }

        resolve();
      });
    }

    /**
     * Render a template with parameters.
     * @param {string} name - The name of the template.
     * @param {Object} params - The parameters to pass to the template.
     * @returns {string} - The rendered HTML.
     */
    render(name, params) {
      name = this.widget.config.code + "_" + name;
      return this.templates.html[name].render(params || {});
    }

    /**
     * Install a placeholder with settings.
     * @param {jQuery} wrapDiv - The jQuery element to prepend the placeholder to.
     * @param {string|null} exception - Optional exception parameter.
     * @returns {jQuery} - The jQuery element for chaining.
     */
    installPlaceholder(wrapDiv, exception = null) {
      let params = {
        prefix: this.widget.config.prefix,
        langs: this.widget.i18n("settings"),
        active: false,
      };

      if (exception !== null) {
        params.exception = exception;
      }

      wrapDiv.prepend(this.render("settings.base", params));
      $("#kommo-settings").fadeIn(300);
      this.widget.loader.displaySaveBtn(this.widget.params.widget_code);
      return this.widget.loader.hide();
    }

    /**
     * Get template helpers for various UI components.
     * @returns {Object} - An object with helper functions for rendering UI components.
     */
    get twig() {
      let _this = this;
      let prefix = _this.widget.config.prefix;
      return {
        modal: (html, destroyCallback = function () {}, className = "") => {
          return new Modal({
            class_name: prefix + "-modal-window " + className + " ",
            init: function ($modal) {
              $modal
                .trigger("modal:loaded")
                .html(html)
                .trigger("modal:centrify");
            },
            destroy: destroyCallback,
          });
        },
        dropdown: (params) => {
          let block = params.block || "";
          let code = params.code || "";
          let defaultParams = $.extend(
            {
              items: [],
              class_name: prefix + "__" + block + "-" + code + " ",
              id: prefix + "-" + block + "-" + code + "-id",
              name: "params[" + block + "][" + code + "]",
              name_is_array: false,
            },
            params
          );

          return _this.widget.render(
            { ref: "/tmpl/controls/checkboxes_dropdown/values_title.twig" },
            defaultParams
          );
        },
        select: (params) => {
          let block = params.block || "";
          let code = params.code || "";
          let defaultParams = $.extend(
            {
              items: [],
              class_name: prefix + "__" + block + "-" + code + " ",
              id: prefix + "-" + block + "-" + code + "-id",
              name: "params[" + block + "][" + code + "]",
            },
            params
          );

          return _this.widget.render(
            { ref: "/tmpl/controls/select.twig" },
            defaultParams
          );
        },
        input: (params) => {
          let block = params.block || "";
          let code = params.code || "";
          let defaultParams = $.extend(
            {
              id: prefix + "-" + block + "-" + code + "-id",
              class_name: prefix + "__" + block + "-" + code + " ",
              name: "params[" + block + "][" + code + "]",
              value: "",
              type: "text",
              placeholder: "",
            },
            params
          );

          return _this.widget.render(
            { ref: "/tmpl/controls/input.twig" },
            defaultParams
          );
        },
        textarea: (params) => {
          let block = params.block || "";
          let code = params.code || "";
          let defaultParams = $.extend(
            {
              id: prefix + "-" + block + "-" + code + "-id",
              class_name: prefix + "__" + block + "-" + code + " ",
              name: "params[" + block + "][" + code + "]",
              value: "",
              placeholder: "",
            },
            params
          );

          return _this.widget.render(
            { ref: "/tmpl/controls/textarea.twig" },
            defaultParams
          );
        },
        button: (params) => {
          let block = params.block || "";
          let code = params.code || "";
          let defaultParams = $.extend(
            {
              class_name: prefix + "__" + block + "-" + code + " ",
              id: prefix + "-" + block + "-" + code + "-id",
              name: "params[" + block + "][" + code + "]",
              text: "",
            },
            params
          );

          return _this.widget.render(
            { ref: "/tmpl/controls/button.twig" },
            defaultParams
          );
        },
      };
    }
  };
});
