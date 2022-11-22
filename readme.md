# Employee Tracker

## Description

A command-line application that manages a company's employee database using Node.js, Inquirer, and MySQL.

The user will be able to:
- view all departments
- view all roles
- view all employees
- add a department by entering the name of a department
- add a role by entering the name, salary, and department for the role
- add an employee by entering the employee's first name, last name, role, and manager
- update an employee role by selecting the employee to update and their new role
- update employee managers by selecting the employee to update and their new manager
- view employees by manager
- view employees by department
- delete departments, roles, and employees
- view the total utilized budget of a department

## Installation

To use [Inquirer](https://www.npmjs.com/package/inquirer/v/8.2.4) version 8.2.4, [MySQL2](https://www.npmjs.com/package/mysql2), [console.table](https://www.npmjs.com/package/console.table), and [dotenv](https://www.npmjs.com/package/dotenv) packages needed for this application, use the following command:
```
npm install
``` 

To create the database, log into MySQL and use
```
SOURCE db/schema.sql
```

To pre-populate the database, use
```
SOURCE db/seeds.sql
```

## Usage

This application is invoked by using the following command:
``` 
npm start
```

## Visuals

![employee tracker screenshot](/images/employee-tracker-screenshot.PNG)

## Walkthrough Video
Use the link below to view a walkthrough of this application.

https://drive.google.com/file/d/1ox3ieGe6NnBjD59jNkBYUjHzkmUwSclv/view?usp=sharing

If the video is blurry, download the video.


## Questions

Feel free to contact me at jennyhawes24@gmail.com or look at my [Github](https://github.com/JenniferKiesler).