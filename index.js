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
        const [departmentCount] = await connection.promise().query('SELECT COUNT(id) AS count FROM department')
        
        let departmentID = departmentCount[0].count + 1

        await connection.promise().query(`
        INSERT INTO department (id, name) VALUES (?, ?)`, [departmentID, answer.name])
        
        console.log("Department was added!")

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
            type: 'list',
            name: 'department',
            message: 'Which department does the role belong to?',
            choices: async () => {
                const [results] = await connection.promise().query('SELECT name FROM department')
                return results
            }
        },
    ])

    try {
        const [roleCount] = await connection.promise().query('SELECT COUNT(id) AS count FROM role')
        
        let roleID = roleCount[0].count + 1
        
        const [result] = await connection.promise().query('SELECT id FROM department WHERE name = ?', [answer.department])
                
        await connection.promise().query(`
        INSERT INTO role (id, title, salary, department_id) VALUES (?, ?, ?, ?)`, [roleID, answer.title, answer.salary, result[0].id])

        console.log("Role was added!")

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

const addEmployee = async () => {
    connection.query(`SELECT role.title, employee.first_name, employee.last_name FROM role LEFT JOIN employee ON role.id = employee.role_id`, async (err, res) => {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'first_name',
                message: "What is the employee's first name?"
            },
            {
                type: 'input',
                name: 'last_name',
                message: "What is the employee's last name?"
            },
            {
                type: 'list',
                name: 'role',
                message: "What is the employee's role?",
                choices: res.map(role => role.title)
            },
            {
                type: 'list',
                name: 'manager',
                message: "What is the employee's manager?",
                choices: () => {
                    let managerList = ['None']
                    
                    for (let i = 0; i < res.length; i++) {
                        if (res[i].first_name != null || res[i].last_name != null) {
                            let managerName = `${res[i].first_name} ${res[i].last_name}`
                            
                            managerList.push(managerName)
                        }
                    }
                    return managerList
                }
            },
        ])
    
        try {
            const [employeeCount] = await connection.promise().query('SELECT COUNT(id) AS count FROM employee')
            
            let employeeID = employeeCount[0].count + 1
            
            const [roleResult] = await connection.promise().query('SELECT id FROM role WHERE title = ?', [answer.role])
    
            const managerArray = answer.manager.split(' ')
            
            if (managerArray[0] != 'None') {
                const [managerResult] = await connection.promise().query(`SELECT id FROM employee WHERE first_name = ? AND last_name = ?`, [managerArray[0], managerArray[1]])
                
                await connection.promise().query(`
                INSERT INTO employee (id, first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?, ?)`, [employeeID, answer.first_name, answer.last_name, roleResult[0].id, managerResult[0].id])

            } else {
                await connection.promise().query(`
                INSERT INTO employee (id, first_name, last_name, role_id) VALUES (?, ?, ?, ?)`, [employeeID, answer.first_name, answer.last_name, roleResult[0].id])
            }
        
                console.log(`${answer.first_name} ${answer.last_name} was added!`)
        
                menuPrompt()
    
        } catch(err) {
            throw new Error(err)
        }
    })
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