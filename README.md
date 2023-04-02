## Title: :pencil2: [university-groups-management-app] :microscope:

### Description

This code is a simple web application for managing groups of students in a university. It allows the user to add, delete and display groups, with additional metadata fields for each group. The code is organized in classes for database management, data model and UI rendering. It uses Web SQL for data storage and VanillaJS for DOM manipulation.

The front-end is implemented in HTML, CSS, and JavaScript, while the back-end is implemented in JavaScript using the Browser SQLite library.

### Code structure

The application has three main classes: `DataBase`, `GroupModel`, and `GroupRenderer`:

- `DataBase`: a class that represents the database. It has methods for creating tables, inserting data into tables, selecting data from tables, and deleting data from tables.

- `GroupModel`: a class that represents a group. It has methods for saving a group to the database, getting all groups from the database, and deleting a group from the database.

- `GroupRenderer`: a class that manages rendering the group form and the group selector. It has methods for creating a new group, resetting the group form, adding additional fields to the group form, and initializing the group selector with data from the database.
