require('dotenv').config();
const cTable = require('console.table');
const inquirer = require('inquirer');
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

let departmentID = 5
let roleID = 9

const viewDepartments = async () => {
    try {
        const [results] = await connection.promise().query('SELECT * FROM department')

        console.table(results)

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

const viewRoles = async () => {
    try {
        const [results] = await connection.promise().query('SELECT role.id, role.title, department.name AS department, role.salary FROM role INNER JOIN department ON role.department_id=department.id')
        
        console.table(results)

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

const viewEmployees = async () => {
    try {
        const [results] = await connection.promise().query(`
        SELECT A.id, A.first_name, A.last_name, role.title, department.name AS department, role.salary, CONCAT(B.first_name, ' ', B.last_name) AS manager 
        FROM employee A
        LEFT JOIN employee B 
        ON A.manager_id=B.id
        INNER JOIN role 
        ON A.role_id=role.id
        INNER JOIN department
        ON role.department_id=department.id`)
        
        console.table(results)

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

const addDepartment = async () => {
    const answer = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the name of the department?'
        }
    ])

    try {
        await connection.promise().query(`
        INSERT INTO department (id, name) VALUES (?, ?)`, [departmentID, answer.name])
        console.log("Department was added!")

        departmentID++

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

const addRole = async () => {
    const answer = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'What is the name of the role?'
        },
        {
            type: 'number',
            name: 'salary',
            message: 'What is the salary of the role?'
        },
        {
            type: 'input',
            name: 'department',
            message: 'Which department does the role belong to?'
        },
    ])

    try {
        const [result] = await connection.promise().query('SELECT id FROM department WHERE name = ?', [answer.department])
        
        await connection.promise().query(`
        INSERT INTO role (id, title, salary) VALUES (?, ?, ?)`, [roleID, answer.title, answer.salary])

        await connection.promise().query(`
        UPDATE role SET department_id = ? WHERE id = ?`, [result, roleID])

        console.log("Role was added!")

        roleID++

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

const menuPrompt = async () => {
    const answer = await inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "What do you want to do?",
            choices: ['View all departments', 'View all roles', 'View all employees', 'Add a department', 'Add a role', 'Add an employee', 'Update an employee role', 'Exit']
        }
    ])

    if (answer.action === 'View all departments') {
        viewDepartments()
    } else if (answer.action === 'View all roles') {
        viewRoles()
    } else if (answer.action === 'View all employees') {
        viewEmployees()
    } else if (answer.action === 'Add a department') {
        addDepartment()
    } else if (answer.action === 'Add a role') {
        addRole()
    } else if (answer.action === 'Add an employee') {
        addEmployee()
    } else if (answer.action === 'Update an employee role') {
        updateEmployeeRole()
    } else {
        process.exit(0)
    }
}

menuPrompt()