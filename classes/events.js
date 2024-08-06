define(["moment", "lib/components/base/modal"], function (Moment, Modal) {
  return class Events {
    constructor(widget) {
      this.widget = widget;
    }

    settings() {
      let _this = this;
      const MODAL_DESTROY_TIMEOUT = 3000;

      // Event handler for creating a new birthday field
      $(".kommo-birthday__field-create__link").on("click", function () {
        // Create and display a modal for field creation
        let modal = _this.widget.templates.twig.modal(
          _this.widget.templates.render("settings.modal", {
            prefix: _this.widget.config.prefix,
            langs: _this.widget.i18n("settings.modal"),
            name: _this.widget.templates.twig.input({
              block: "field",
              code: "name",
            }),
            entity: _this.widget.templates.twig.select({
              block: "field",
              code: "entity",
              items: [
                {
                  id: APP.element_types.contacts,
                  option: _this.widget.i18n("settings.entity.options.contact"),
                },
                {
                  id: APP.element_types.leads,
                  option: _this.widget.i18n("settings.entity.options.lead"),
                },
              ],
              selected: APP.element_types.contacts,
            }),

            button: _this.widget.templates.twig.button({
              block: "field",
              code: "btn",
              text: _this.widget.i18n("settings.modal.create"),
            }),
          }),

          // Callback when the modal is created
          function () {},
          _this.widget.config.prefix + "__field-modal"
        );

        // Event handler for the button in the modal
        $("#" + _this.widget.config.prefix + "-field-btn-id").on(
          "click",

          function () {
            const resultModal = new Modal();

            let selected = {};
            // Serialize form data into JSON
            let form =
              $(
                "#" + _this.widget.config.prefix + "__field-form"
              ).serializeJSON().params || {};
            let et = parseInt(form.field.entity) === 1 ? "contacts" : "leads";

            // Create a new birthday field
            _this.widget.kommo
              .createField(et, {
                type: "birthday",
                name: form.field.name,
              })
              .then(function (result) {
                selected = result;

                // Fetch available fields for the select element
                return _this.widget.kommo.getFieldsByType(
                  [
                    APP.cf_types.date,
                    APP.cf_types.date_time,
                    APP.cf_types.birthday,
                  ],
                  [APP.element_types.contacts, APP.element_types.leads],
                  true
                );
              })
              .then(function (fields) {
                // Update the select element with new fields
                $("." + _this.widget.config.prefix + "__field-id").replaceWith(
                  _this.widget.templates.twig.select({
                    block: "field",
                    code: "id",
                    items: fields,
                    selected: selected.id || 0,
                  })
                );

                modal.destroy();

                resultModal.showSuccess(
                  _this.widget.i18n("settings.modal.success_saved"),
                  false,
                  MODAL_DESTROY_TIMEOUT
                );
              })
              .catch(() => {
                resultModal.showError("", false);
              });
          }
        );
      });

      // If templates exist, initialize and display them
      if (_this.widget.info.params.templates.length > 0) {
        let created = _this.widget.info.params.templates.split(",");
        $("#kommo-birthday-templates-list").val(
          _this.widget.info.params.templates || ""
        );
        _this.widget.kommo.getTemplates().then(function (templates) {
          created = created.map(function (item) {
            return parseInt(item);
          });
          templates.filter(function (item) {
            if ($.inArray(item.id, created) > -1) {
              $("#kommo-birthday-templates-list-ul").append(
                "<li>" + item.name + "</li>"
              );
            }
          });
        });
      }

      // Event handler for creating a new birthday template
      $("#kommo-birthday-template-create-id").on("click", function () {
        let name = $("#kommo-birthday-template-name-id").val();
        let text = $("#kommo-birthday-template-text-id").val();

        if (name.length === 0 || text.length === 0) {
          // Show error if fields are empty
          new Modal().showError(
            _this.widget.i18n("settings.errors.template_fields_required"),
            false
          );
        } else {
          // Create a new template
          _this.widget.kommo
            .createTemplate({
              name: name,
              reply_name: name,
              content: text,
              reply_text: text,
              is_editable: true,
              type: "amocrm",
              attachments: [],
              buttons: [],
              widget_code: null,
              client_uuid: null,
              creator_logo_url: null,
              waba_footer: null,
              waba_category: null,
              waba_language: null,
              waba_examples: {},
              reviews: null,
              waba_header: null,
              waba_selected_waba_ids: [],
            })
            .then(function (id) {
              if (parseInt(id) > 0) {
                // Clear input fields and update template list
                $("#kommo-birthday-template-text-id").val("");
                $("#kommo-birthday-template-name-id").val("");

                let old = $("#kommo-birthday-templates-list").val().split(",");
                old.push(id);
                old = old.filter(function (item) {
                  return parseInt(item) > 0;
                });
                $("#kommo-birthday-templates-list").val(old.join(","));
                $("#kommo-birthday-templates-list-ul").append(
                  "<li>" + name + "</li>"
                );
              }
            });
        }
      });
    }

    /**
     * Get birthday information based on current date.
     * @returns {Object} - Contains information if today is a birthday and the current date.
     */
    getBirthdayInfo() {
      const fieldId = parseInt(
        this.widget.getNested(this.widget.info.params, "field.id", "")
      );

      const $wrap = $('.linked-form__field[data-id="' + fieldId + '"]');
      const filtered = $wrap.filter(function () {
        const formattedDate = Moment().format(
          APP.system.format.date.date_short
        );
        const dayMonth = $(this).find("input").val().slice(0, 5);

        return dayMonth === formattedDate;
      });

      const currentDate = Moment().format(APP.system.format.date.date);

      return {
        isBirthday: filtered.length > 0,
        currentDate: currentDate,
      };
    }

    /**
     * Handle the card view, create tasks if it's a birthday.
     */
    card() {
      const _this = this;

      const { isBirthday } = _this.getBirthdayInfo();

      if (isBirthday) {
        let entityType = parseInt(
          _this.widget.getNested(_this.widget.info.params, "entity.type", 2)
        );

        let responsibles = _this.widget.getNested(
          _this.widget.info.params,
          "tasks.responsible",
          {}
        );

        // Add the main user to the list of responsibles if not already present
        if (responsibles[1]) {
          responsibles[APP.data.current_card.main_user] =
            APP.data.current_card.main_user;
        }

        // If the entity type matches and the user is responsible, create a task
        if (
          entityType === parseInt(APP.data.current_card.element_type) &&
          responsibles[APP.constant("user").id]
        ) {
          _this.createTask(isBirthday);
        }
      }
    }

    /**
     * Create a task if it's a birthday
     * @param {boolean} isBirthday - Whether today is a birthday.
     */
    createTask(isBirthday) {
      const _this = this;

      let { currentDate } = _this.getBirthdayInfo();

      if (isBirthday) {
        const taskType = parseInt(
          _this.widget.getNested(_this.widget.info.params, "tasks.type", 1)
        );

        // Check if there are existing tasks
        _this.widget.kommo
          .getTasks({
            is_completed: 0,
            entity_type: APP.data.current_entity,
            entity_id: APP.data.current_card.id,
            task_type: taskType,
          })
          .then(function (tasks) {
            // If no tasks exist, create a new one
            if (tasks.length === 0) {
              _this.widget.kommo.createTask({
                responsible_user_id: APP.constant("user").id,
                entity_id: APP.data.current_card.id,
                entity_type: "leads",
                task_type_id: taskType,
                text: _this.widget.getNested(
                  _this.widget.info.params,
                  "tasks.text",
                  "-"
                ),

                complete_till: Moment(
                  (currentDate += " 23:59"),
                  APP.system.format.date.full
                ).unix(),
              });
            }
          });
      }
    }
  };
});
