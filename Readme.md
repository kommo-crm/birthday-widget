<p align="center"><img width="552" alt="new kommo" src="images/github images/kommo_logo.png"></p>

# Birthday Widget

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)


## Description

This widget is designed to enhance data management within your account. It includes features for creating tasks, configuring custom fields and templates, automating tasks based on birthdays, send birthday wishes to contacts in the lead profile.

## Features

- **Task Creation and Management**: Allows you to create and manage tasks via the API.
- **Custom Fields**: Create and configure custom fields, such as "birthday" fields.
- **Templates**: Support for creating and managing message templates.
- **Birthday wishes**: Send the template with birthday wishes via pressing the button in the lead profile.
- **Task Automation**: Automatically creates tasks based on settings and events.

## Installation

1. **Upload the Widget**: Upload the widget files to the Kommo platform as a private integration.
2. **Install the Widget**: Once uploaded, install the widget through Kommo’s integration's settings page.

## Usage

### Interface

The widget is available in the following locations:

- **Widget Settings**: Access settings and create new fields and templates.
- **Lead Profile**: The widget can be embedded in the entity profile for task and field management.

### Creating and Managing Tasks

1. Open the widget settings and select the tasks section.
 
   <img width="600" alt="add task" src="images/github images/task.png">

2. Create a new task, specify the required parameters, and save it.

### Working with Fields

1. In the fields section, add new custom fields such as a Birthday/Date/Date and Time field for contacts or leads.
   <br>
   <img width="600" alt="add field" src="images/github images/create_field.png">
2. Or choose one that already exists.
   <br>
   <img width="600" alt="select field" src="images/github images/select_field.png">

### Message Templates

1. Go to the templates section in widget settings and create a new template.
   <br>
   <img width="600" alt="create template" src="images/github images/create_template.png">

2. Provide the name and content of the template.
3. Use the templates for messages based on events.

### Send a birthday wish:

1. On the right panel of a lead profile click the button 'Send a birthday wish' if it exists.
   <br><br>
    <img width="213" alt="birthday button" src="images/github images/birthday_button.png">
    
2. Choose your template from the list of templates.
   <br>
<img width="492" alt="templates list" src="images/github images/Send _template.png">

### Notes

- **Caching**: The widget uses caching to speed up requests and reduce server load.


## Additional Resources

The full tutorial on developing this widget is available on [Kommo developers' page](https://developers.kommo.com/docs/widgets-tutorial).

## Community

Join our community on [Discord](https://discord.gg/CjstJTrBHu)!

## License

MIT
