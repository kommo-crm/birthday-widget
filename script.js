window.KommoWidget = window.KommoWidget || {};
define([
  "./classes/template.js",
  "./classes/loader.js",
  "./classes/kommo.js",
  "./classes/events.js",
  "./classes/settings.js",
  "./plugins/jquery.serializejson.min.js",
], function (Templates, Loader, Kommo, Events, Settings) {
  return function () {
    let _this = this;
    const QUICK_ACTIONS_CLICK_TIMEOUT = 200;

    _this.config = {
      // Unique code for the widget
      code: "kommo_birthday",
      // CSS prefix for styling
      prefix: "kommo-birthday",
      templates: {
        params: {
          settings: [
            {
              id: "loader",
              path: "/loader",
            },
            {
              id: "settings.base",
              path: "/settings/base",
            },
            {
              id: "settings.modal",
              path: "/settings/modal",
            },
          ],
          lcard: [
            {
              id: "widget_right_panel",
              path: "/widget_right_panel",
            },
          ],
        },
      },
      css: [
        {
          name: "kommo",
          // ID for appending common CSS
          append_id: "kommo-common-style",
        },
        {
          // Additional CSS
          name: "style",
        },
      ],
      icons: {},
    };

    // Stores widget information
    _this.info = {};

    /**
     * Retrieves a nested property from an object based on a dot notation string.
     * @param {Object} obj - The object to query.
     * @param {string} desc - Dot notation string representing the property path.
     * @param {any} [value] - Default value if the property is not found.
     * @returns {any} - The value at the specified property path.
     */
    _this.getNested = function (obj, desc, value) {
      let arr = desc ? desc.split(".") : [];

      while (arr.length && obj) {
        let comp = arr.shift();
        let match = /(.+)\[([0-9]*)\]/.exec(comp);

        if (match !== null && match.length == 3) {
          let arrayData = {
            arrName: match[1],
            arrIndex: match[2],
          };
          if (typeof obj[arrayData.arrName] !== "undefined") {
            obj = obj[arrayData.arrName][arrayData.arrIndex];
          } else {
            obj = null;
          }

          continue;
        }

        obj = obj[comp];
      }

      if (typeof value !== "undefined") {
        if (obj === null || typeof obj === "undefined" || obj === undefined) {
          return value;
        }
      }

      return obj;
    };

    /**
     * Validates widget settings. Placeholder function.
     * @param {Object} params - The settings parameters to validate.
     * @returns {boolean} - Validation result.
     */
    _this.validateSettings = function (params) {
      // Placeholder implementation
      return true;
    };

    _this.callbacks = {
      /**
       * Callback for digital pipline setting
       */
      dpSettings: function () {},
      /**
       * Common callback called after render callback
       * @returns {boolean}
       */
      bind_actions: function () {
        return true;
      },

      /**
       * Render callback
       * @returns {boolean}
       */
      render: function () {
        _this.config.icons = {
          path: _this.params.path + "/images",
        };

        _this.debug = console;
        _this.kommo = new Kommo(_this);
        _this.templates = new Templates(_this);
        _this.loader = new Loader(_this);
        _this.events = new Events(_this);
        _this.settings = new Settings(_this);
        return APP.widgets.system.area === "settings" ||
          APP.widgets.system.area === "advanced-settings"
          ? true
          : _this.templates.preload().then(() => {
              let areas = ["ccard", "lcard"];
              if ($.inArray(APP.widgets.system.area, areas) >= 0) {
                _this.settings.load().then(function () {
                  _this.events.card();
                });
              }

              return true;
            });
      },
      /**
       * Callback for widget settings
       * @returns {boolean|Promise} - Resolves to true after settings are loaded and rendered.
       */
      settings: function () {
        let prefix = _this.config.prefix;
        let status = (_this.params || {}).status || "";
        let activeStatuses = ["not_configured", "installed"];
        let isActive =
          status.length > 0 && $.inArray(status, activeStatuses) >= 0;
        let modalBlock = $(".modal." + _this.params.widget_code);
        let wrapDiv = modalBlock.find(".widget_settings_block");
        _this.templates.preload().then(function () {
          if (isActive) {
            wrapDiv.find(".widget_settings_block__controls").hide();
            wrapDiv.find(".widget_settings_block__descr").hide();
            _this.loader.prepend(wrapDiv);
            _this.settings
              .load(modalBlock)
              .then(function () {
                return Promise.all([
                  _this.kommo.getTaskTypes(),
                  _this.kommo.getFieldsByType(
                    [
                      APP.cf_types.date,
                      APP.cf_types.date_time,
                      APP.cf_types.birthday,
                    ],
                    [APP.element_types.contacts, APP.element_types.leads],
                    true
                  ),
                  _this.kommo.getUsers(),
                ]);
              })
              .then(function ([tasks, fields, users]) {
                _this.info.params = _this.info.params || {};

                // Add current user to users list
                users.unshift({
                  id: 1,
                  option: _this.i18n("settings.responsible.current"),
                });

                return new Promise(function (resolve) {
                  wrapDiv.prepend(
                    _this.templates.render("settings.base", {
                      prefix: prefix,
                      langs: _this.i18n("settings"),
                      icons: _this.config.icons,
                      version: _this.params.version,
                      active: true,
                      field: _this.templates.twig.select({
                        block: "field",
                        code: "id",
                        items: fields,
                        selected: _this.getNested(
                          _this.info.params,
                          "field.id",
                          ""
                        ),
                      }),

                      entity: _this.templates.twig.select({
                        block: "entity",
                        code: "type",
                        items: [
                          {
                            id: 1,
                            option: _this.i18n(
                              "settings.entity.options.contact"
                            ),
                          },
                          {
                            id: 2,
                            option: _this.i18n("settings.entity.options.lead"),
                          },
                        ],
                        selected: _this.getNested(
                          _this.info.params,
                          "entity.type",
                          1
                        ),
                      }),
                      responsible: _this.templates.twig.dropdown({
                        block: "tasks",
                        code: "responsible",
                        title_empty: _this.i18n("settings.responsible.select"),
                        title_numeral: _this.i18n(
                          "settings.responsible.numeral"
                        ),
                        name_is_array: true,
                        items: users.filter(function (user) {
                          user.name =
                            "params[tasks][responsible][" + user.id + "]";
                          user.is_checked = !!_this.getNested(
                            _this.info.params,
                            "tasks.responsible",
                            {}
                          )[user.id];

                          return user;
                        }),
                      }),
                      type: _this.templates.twig.select({
                        block: "tasks",
                        code: "type",
                        items: tasks,
                        selected: _this.getNested(
                          _this.info.params,
                          "tasks.type",
                          1
                        ),
                      }),
                      text: _this.templates.twig.textarea({
                        block: "tasks",
                        code: "text",
                        placeholder: _this.i18n("settings.text.placeholder"),
                        value: _this.getNested(
                          _this.info.params,
                          "tasks.text",
                          ""
                        ),
                      }),
                      template: {
                        name: _this.templates.twig.input({
                          block: "template",
                          code: "name",
                        }),
                        text: _this.templates.twig.textarea({
                          block: "template",
                          code: "text",
                          placeholder: _this.i18n(
                            "settings.template.text.placeholder"
                          ),
                        }),
                        create: _this.templates.twig.button({
                          block: "template",
                          code: "create",
                          text: _this.i18n("settings.template.create"),
                          value: 1,
                        }),
                      },
                    })
                  );
                  resolve();
                });
              })
              .then(() => {
                _this.events.settings();
                $("#kommo-settings").fadeIn(300);
                _this.loader.displaySaveBtn(_this.params.widget_code);

                return _this.loader.hide();
              })
              .catch(function (ex) {
                let exMsg = "";
                if (typeof ex === "object" && ex !== null) {
                  exMsg = ex.name + ": " + ex.message;
                } else {
                  exMsg = ex;
                }
                _this.debug.log(ex);
                isActive = false;
              });
          }

          if (!isActive) {
            return _this.templates.installPlaceholder(wrapDiv);
          }
        });

        return true;
      },

      /**
       * Widget initialization
       * @returns {boolean|Promise} - Resolves to true after initialization.
       */
      init: function () {
        if (APP.widgets.system.area === "lcard") {
          const isBirthday = _this.events.getBirthdayInfo().isBirthday;

          _this.templates
            .preload()
            .then(() => {
              _this.render_template({
                caption: {
                  class_name: "kommo-birthday__right_panel__container",
                },
                body: "",
                render: _this.templates.render("widget_right_panel", {
                  button: isBirthday
                    ? _this.templates.twig.button({
                        block: "button",
                        code: "congratulate",
                        text: _this.i18n("settings.widget_panel.congratulate"),
                        value: 1,
                      })
                    : "",
                  text: isBirthday
                    ? _this.i18n("settings.widget_panel.birthday")
                    : _this.i18n("settings.widget_panel.not_birthday"),
                }),
              });
            })
            .then(() => {
              $(".kommo-birthday__button-congratulate").on(
                "click",
                function () {
                  setTimeout(function () {
                    $(".feed-compose__quick-actions-wrapper").click();
                  }, QUICK_ACTIONS_CLICK_TIMEOUT);
                }
              );
            });
        }

        return true;
      },
      /**
       * Callback for saving widget settings.
       * @param {Event} evt - The event object.
       * @returns {Promise<boolean>} - Resolves to true if settings are saved successfully.
       */
      onSave: function (evt) {
        return _this.settings.save(evt);
      },
      /**
       * Callback for destroying widget object
       */
      destroy: function () {},
      /**
       * Callback for contact list
       */
      contacts: {
        selected: function () {},
      },
      /**
       * Callback for leads list
       */
      leads: {
        selected: function () {},
      }
    };

    return this;
  };
});
