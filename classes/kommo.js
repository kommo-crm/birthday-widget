define(["./http.js"], function (Http) {
  return class Kommo {
    constructor(widget) {
      // Create an instance of the Http class for making requests
      this.http = new Http();
      this.widget = widget;
    }

    /**
     * Retrieve account information.
     * @returns {Promise} - A promise that resolves with the account data.
     */
    getAccount() {
      return this.http.request(
        "/api/v4/account",
        { with: "task_types" },
        "GET",
        {
          cache: { key: "kbd_account", expires: 60 },
          baseURL: window.location.origin,
        }
      );
    }

    /**
     * Retrieve tasks based on a filter.
     * @param {Object} filter - The filter criteria for tasks.
     * @returns {Promise} - A promise that resolves with an array of tasks.
     */
    getTasks(filter) {
      return this.http
        .request(
          "/api/v4/tasks",
          {
            filter: filter,
          },
          "GET",
          {
            baseURL: window.location.origin,
          }
        )
        .then(function (data) {
          return ((data || {})._embedded || {}).tasks || [];
        });
    }

    /**
     * Create a new task.
     * @param {Object} payload - The task data to be created.
     * @returns {Promise} - A promise that resolves with the created task.
     */
    createTask(payload) {
      return this.http
        .request("/api/v4/tasks", JSON.stringify([payload]), "POST", {
          baseURL: window.location.origin,
        })
        .then(function (data) {
          return ((data || {})._embedded || {}).tasks || [];
        });
    }

    /**
     * Create a new custom field for a specified entity type.
     * @param {string} et - The entity type (e.g., 'leads', 'contacts').
     * @param {Object} payload - The field data to be created.
     * @returns {Promise} - A promise that resolves with the created custom field.
     */
    createField(et, payload) {
      let _this = this;
      return _this.http
        .request(
          "/api/v4/" + et + "/custom_fields",
          JSON.stringify([payload]),
          "POST",
          {
            baseURL: window.location.origin,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(function (data) {
          return (((data || {})._embedded || {}).custom_fields || [])[0] || {};
        });
    }

    /**
     * Create a new chat template.
     * @param {Object} payload - The template data to be created.
     * @returns {Promise} - A promise that resolves with the ID of the created template.
     */
    createTemplate(payload) {
      return this.http
        .request(
          "/ajax/v1/chats/templates/add",
          JSON.stringify({
            request: payload,
          }),
          "POST",
          {
            baseURL: window.location.origin,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then(function (data) {
          return (
            ((((data || {}).response || {}).chats || {}).templates || {})
              .added || 0
          );
        });
    }

    /**
     * Retrieve chat templates with additional data.
     * @returns {Promise} - A promise that resolves with an array of chat templates.
     */
    getTemplates() {
      return this.http
        .request(
          "/ajax/v4/chats/templates",
          {
            with: "integration,reviews",
            limit: 50,
            page: 1,
          },
          "GET",
          {
            baseURL: window.location.origin,
          }
        )
        .then(function (data) {
          return ((data || {})._embedded || {}).chat_templates || {};
        });
    }

    /**
     * Retrieve users, paginated.
     * @param {Array} [users=[]] - Accumulator for user data.
     * @param {number} [page=1] - The page number to retrieve.
     * @returns {Promise} - A promise that resolves with an array of users.
     */
    getUsers(users = [], page = 1) {
      let _this = this;
      return this.http
        .request(
          "/api/v4/users",
          {
            limit: 100,
            page: page,
          },
          "GET",
          {
            baseURL: window.location.origin,
          }
        )
        .then(function (data) {
          return new Promise((resolve) => {
            let tmp = ((data || {})._embedded || {}).users || [];
            tmp.forEach(function (user) {
              if (user.rights.is_active) {
                users.push({
                  id: user.id,
                  option: user.name,
                  name: user.name,
                  is_admin: user.rights.is_admin,
                });
              }
            });

            if (data._page_count > 1 && data._page < data._page_count) {
              // Fetch the next page if more pages are available
              resolve(_this.getUsers(users, page + 1));
            } else {
              resolve(users);
            }
          });
        });
    }

    /**
     * Retrieve task types from the account information.
     * @returns {Promise} - A promise that resolves with an array of task types.
     */
    getTaskTypes() {
      return this.getAccount().then(function (account) {
        let types = ((account || {})._embedded || {}).task_types || {};
        types = Object.values(types).filter(function (item) {
          item.option = item.name;
          return item;
        });
        return types;
      });
    }

    /**
     * Retrieve custom fields for a specified entity type, paginated.
     * @param {string} et - The entity type (e.g., 'leads', 'contacts').
     * @param {number} [page=1] - The current page number to retrieve.
     * @param {Array} [fields=[]] - Accumulator for custom fields.
     * @returns {Promise} - A promise that resolves with an array of custom fields.
     */
    getFields(et, page = 1, fields = []) {
      let _this = this;
      return _this.http
        .request(
          "/api/v4/" + et + "/custom_fields",
          {
            page: page,
          },
          "GET",
          {
            baseURL: window.location.origin,
          }
        )
        .then(function (data) {
          let cf = ((data || {})._embedded || {}).custom_fields || [];
          if (cf.length === 0) {
            return fields;
          }

          fields = fields.concat(cf);
          if (((data || {})._page_count || 0) > 1) {
            page++;
            return _this.getFields(et, page, fields);
          } else {
            return fields;
          }
        });
    }

    /**
     * Returns an empty promise that resolves with an empty array.
     * @returns {Promise} - A promise that resolves with an empty array.
     */
    getEmptyPromise() {
      return new Promise(function (resolve) {
        resolve([]);
      });
    }

    /**
     * Retrieve custom fields for specified entity types.
     * @param {Array|string} fieldTypes - Field types to filter by.
     * @param {Array|string|null} [entityType=null] - Entity types to retrieve fields for.
     * @param {boolean} [addPostfix=false] - Whether to add a postfix to field names.
     * @returns {Promise} - A promise that resolves with an array of custom fields.
     */
    getFieldsByType(fieldTypes, entityType = null, addPostfix = false) {
      let _this = this;
      let entityTypes = [];
      if (entityType) {
        entityTypes = !Array.isArray(entityType) ? [entityType] : entityType;
      }

      return Promise.all([
        $.inArray(APP.element_types.leads, entityTypes) >= 0
          ? _this.getFields("leads")
          : _this.getEmptyPromise(),
        $.inArray(APP.element_types.contacts, entityTypes) >= 0
          ? _this.getFields("contacts")
          : _this.getEmptyPromise(),
      ]).then(function ([leadFields, contactFields]) {
        let fields = [];

        if (!Array.isArray(fieldTypes)) {
          fieldTypes = [fieldTypes];
        }

        entityTypes.forEach(function (et) {
          let cf = {};
          let postfix = "";
          switch (et) {
            case APP.element_types.contacts:
              cf = contactFields;
              postfix += " (" + _this.widget.i18n("settings.contact") + ")";
              break;
            case APP.element_types.leads:
              cf = leadFields;
              postfix += " (" + _this.widget.i18n("settings.lead") + ")";
              break;
          }

          if (!addPostfix) {
            postfix = "";
          }

          if (cf.length > 0) {
            cf.forEach(function (field) {
              if (
                APP.cf_types[field.type] &&
                $.inArray(APP.cf_types[field.type], fieldTypes) >= 0
              ) {
                fields.push({
                  id: field.id,
                  code: (field.code || "").toLowerCase(),
                  sort: field.sort,
                  option: field.name + postfix,
                  type: APP.cf_types[field.type],
                  entity_type: et,
                  parent_id: 0,
                  enums: field.enums || [],
                  is_hidden: false,
                });
              }
            });
          }
        });

        return fields;
      });
    }
  };
});
