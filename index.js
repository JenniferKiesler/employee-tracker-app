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

// views all departments
const viewDepartments = async () => {
    try {
        const [results] = await connection.promise().query('SELECT * FROM department')

        console.table(results)

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

// views all roles
const viewRoles = async () => {
    try {
        const [results] = await connection.promise().query('SELECT role.id, role.title, department.name AS department, role.salary FROM role LEFT JOIN department ON role.department_id=department.id')
        
        console.table(results)

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

// views all employees
const viewEmployees = async () => {
    try {
        const [results] = await connection.promise().query(`
        SELECT A.id, A.first_name, A.last_name, role.title, department.name AS department, role.salary, CONCAT(B.first_name, ' ', B.last_name) AS manager 
        FROM employee A
        LEFT JOIN employee B 
        ON A.manager_id=B.id
        LEFT JOIN role 
        ON A.role_id=role.id
        LEFT JOIN department
        ON role.department_id=department.id`)
        
        console.table(results)

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

// adds a department
const addDepartment = async () => {
    const answer = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the name of the department?'
        }
    ])

    try {
        // creates an array of the department ids
        const [results] = await connection.promise().query('SELECT id FROM department')
        let departmentIds = results.map(department => department.id)

        // counts how many department ids there are
        const [departmentCount] = await connection.promise().query('SELECT COUNT(id) AS count FROM department')
        
        let departmentID = departmentCount[0].count + 1
        
        // continues adding 1 until id is unique
        while (departmentIds.includes(departmentID)) {
            departmentID++
        }

        // adds new department
        await connection.promise().query(`
        INSERT INTO department (id, name) VALUES (?, ?)`, [departmentID, answer.name])
        
        console.log(`${answer.name} was added!`)

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

// adds a role
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
        // creates an array of the role ids
        const [results] = await connection.promise().query('SELECT id FROM role')
        let roleIds = results.map(role => role.id)
    
        // counts how many role ids there are
        const [roleCount] = await connection.promise().query('SELECT COUNT(id) AS count FROM role')
        
        let roleID = roleCount[0].count + 1

        // continues adding 1 until id is unique
        while (roleIds.includes(roleID)) {
            roleID++
        }
        
        // gets department id
        const [result] = await connection.promise().query('SELECT id FROM department WHERE name = ?', [answer.department])
        
        // adds a role
        await connection.promise().query(`
        INSERT INTO role (id, title, salary, department_id) VALUES (?, ?, ?, ?)`, [roleID, answer.title, answer.salary, result[0].id])

        console.log(`${answer.title} was added!`)

        menuPrompt()

    } catch(err) {
        throw new Error(err)
    }
}

// adds an employee
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
            // creates an array of the employee ids
            const [results] = await connection.promise().query('SELECT id FROM employee')
            let employeeIds = results.map(employee => employee.id)

            // counts how many employee ids there are
            const [employeeCount] = await connection.promise().query('SELECT COUNT(id) AS count FROM employee')
            
            let employeeID = employeeCount[0].count + 1

            // continues adding 1 until id is unique
            while (employeeIds.includes(employeeID)) {
                employeeID++
            }
            
            // gets role id
            const [roleResult] = await connection.promise().query('SELECT id FROM role WHERE title = ?', [answer.role])
    
            // splits manager's name
            const managerArray = answer.manager.split(' ')
            
            if (managerArray[0] != 'None') {
                // gets manager id
                const [managerResult] = await connection.promise().query(`SELECT id FROM employee WHERE first_name = ? AND last_name = ?`, [managerArray[0], managerArray[1]])
                
                // adds employee with a manager
                await connection.promise().query(`
                INSERT INTO employee (id, first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?, ?)`, [employeeID, answer.first_name, answer.last_name, roleResult[0].id, managerResult[0].id])

            } else {
                // adds employee without a manager
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

// updates employee role
const updateEmployeeRole = async () => {
    connection.query(`SELECT role.title, employee.first_name, employee.last_name FROM role LEFT JOIN employee ON role.id = employee.role_id`, async (err, res) => {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'employee',
                message: "Which employee's role do you want to update?",
                choices: () => {
                    let employeeList = []
                    
                    for (let i = 0; i < res.length; i++) {
                        if (res[i].first_name != null || res[i].last_name != null) {
                            let employeeName = `${res[i].first_name} ${res[i].last_name}`
                            
                            employeeList.push(employeeName)
                        }
                    }
                    return employeeList
                }
            },
            {
                type: 'list',
                name: 'role',
                message: "Which role do you want to assign the selected employee?",
                choices: () => {
                    let roles = res.map(role => role.title)
                    let rolesList = [...new Set(roles)]
                    return rolesList
                }
            },
        ])
    
        try {
            // splits employee name and gets employee id
            const employeeArray = answer.employee.split(' ')
            const [employeeResult] = await connection.promise().query(`SELECT id FROM employee WHERE first_name = ? AND last_name = ?`, [employeeArray[0], employeeArray[1]])

            // gets role id
            const [roleResult] = await connection.promise().query(`SELECT id FROM role WHERE title = ?`, [answer.role])
                
            // updates employee role
            await connection.promise().query(`
            UPDATE employee SET role_id = ? WHERE id = ?`, [roleResult[0].id, employeeResult[0].id])

            console.log(`${answer.employee}'s role was updated!`)
    
            menuPrompt()
    
        } catch(err) {
            throw new Error(err)
        }
    })
}

// updates employee manager
const updateEmployeeManager = async () => {
    connection.query(`SELECT first_name, last_name FROM employee`, async (err, res) => {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'employee',
                message: "Which employee's manager do you want to update?",
                choices: () => {
                    let employeeList = []
                    
                    for (let i = 0; i < res.length; i++) {
                        if (res[i].first_name != null || res[i].last_name != null) {
                            let employeeName = `${res[i].first_name} ${res[i].last_name}`
                            
                            employeeList.push(employeeName)
                        }
                    }
                    return employeeList
                }
            },
            {
                type: 'list',
                name: 'manager',
                message: "Which manager do you want to assign the selected employee?",
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
            // splits employee name and gets employee id
            const employeeArray = answer.employee.split(' ')
            const [employeeResult] = await connection.promise().query(`SELECT id FROM employee WHERE first_name = ? AND last_name = ?`, [employeeArray[0], employeeArray[1]])

            // splits manager name
            const managerArray = answer.manager.split(' ')
            if (managerArray[0] != 'None') {
                // gets manager id
                const [managerResult] = await connection.promise().query(`SELECT id FROM employee WHERE first_name = ? AND last_name = ?`, [managerArray[0], managerArray[1]])
                
                // updates employee manager with new manager
                await connection.promise().query(`
                UPDATE employee SET manager_id = ? WHERE id = ?`, [managerResult[0].id, employeeResult[0].id])

            } else {
                // employee has no manager
                await connection.promise().query(`
                UPDATE employee SET manager_id = null WHERE id = ?`, [employeeResult[0].id])
            }

            console.log(`${answer.employee}'s manager was updated!`)
    
            menuPrompt()
    
        } catch(err) {
            throw new Error(err)
        }
    })
}

// view employees by manager
const viewEmployeesByManager = async () => {
    connection.query(`SELECT first_name, last_name FROM employee`, async (err, res) => {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'manager',
                message: "Which manager do you want to use to view the employees?",
                choices: () => {
                    let managerList = []
                    
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
            // splits manager name
            const managerArray = answer.manager.split(' ')
            
            // gets manager id
            const [managerResult] = await connection.promise().query(`SELECT id FROM employee WHERE first_name = ? AND last_name = ?`, [managerArray[0], managerArray[1]])
                
            const [results] = await connection.promise().query(`
            SELECT A.id, A.first_name, A.last_name, role.title, department.name AS department, role.salary, CONCAT(B.first_name, ' ', B.last_name) AS manager 
            FROM employee A
            LEFT JOIN employee B 
            ON A.manager_id=B.id
            INNER JOIN role 
            ON A.role_id=role.id
            INNER JOIN department
            ON role.department_id=department.id
            WHERE A.manager_id = ?`, [managerResult[0].id])
            
            console.table(results)
    
            menuPrompt()
    
        } catch(err) {
            throw new Error(err)
        }
    })
}

// view employees by department
const viewEmployeesByDepartment = async () => {
    connection.query(`SELECT name FROM department`, async (err, res) => {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'department',
                message: "Which department do you want to use to view the employees?",
                choices: res.map(department => department.name)
            },
        ])
    
        try {
            // gets department id
            const [departmentResult] = await connection.promise().query(`SELECT id FROM department WHERE name = ?`, [answer.department])

            const [results] = await connection.promise().query(`
            SELECT A.id, A.first_name, A.last_name, role.title, department.name AS department, role.salary, CONCAT(B.first_name, ' ', B.last_name) AS manager 
            FROM employee A
            LEFT JOIN employee B 
            ON A.manager_id=B.id
            INNER JOIN role 
            ON A.role_id=role.id
            INNER JOIN department
            ON role.department_id=department.id
            WHERE department.id = ?`, [departmentResult[0].id])
            
            console.table(results)
    
            menuPrompt()
    
        } catch(err) {
            throw new Error(err)
        }
    })
}

// delete department, role, or employee
const deleteOption = async () => {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'tableName',
                message: 'Delete department, role, or employee?',
                choices: ['department', 'role', 'employee']
            },
        ])
            connection.query(`SELECT * FROM employee INNER JOIN role INNER JOIN department`, async (err, res) => {
                const answer2 = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'name',
                        message: `Which ${answer.tableName} do you want to delete?`,
                        choices: () => {
                            if (answer.tableName === 'department') {
                                let departments = res.map(department => department.name)
                                let departmentsList = [...new Set(departments)]
                                return departmentsList
                            } else if (answer.tableName === 'role') {
                                let roles = res.map(role => role.title)
                                let rolesList = [...new Set(roles)]
                                return rolesList
                            } else if (answer.tableName === 'employee') {
                                let employeeList = []
                                for (let i = 0; i < res.length; i++) {
                                    if (res[i].first_name != null || res[i].last_name != null) {
                                        let employeeName = `${res[i].first_name} ${res[i].last_name}`
                                        if (!employeeList.includes(employeeName)) {
                                            employeeList.push(employeeName)
                                        }
                                    }
                                }
                                return employeeList
                            }
                        }
                    },
                
                ])

                try {
                    if (answer.tableName === 'department') {
                        await connection.promise().query(`DELETE FROM department WHERE name = ?`, [answer2.name])

                    } else if (answer.tableName === 'role') {
                        await connection.promise().query(`DELETE FROM role WHERE title = ?`, [answer2.name])

                    } else if (answer.tableName === 'employee') {
                        const employeeArray = answer2.name.split(' ')

                        await connection.promise().query(`DELETE FROM employee WHERE first_name = ? AND last_name = ?`, [employeeArray[0], employeeArray[1]])
                    }
        
                    console.log(`${answer2.name} was deleted!`)
        
                    menuPrompt()
        
                } catch(err) {
                    throw new Error(err)
                }

            })
           
}

// view total utilized budget of a department
const totalBudget = async () => {
    connection.query(`SELECT name FROM department`, async (err, res) => {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'department',
                message: 'Which department do you want to see the total utilized budget for?',
                choices: res.map(department => department.name)
            },
        ])

        try {
            // gets department id
            const [departmentResult] = await connection.promise().query(`SELECT id FROM department WHERE name = ?`, [answer.department])

            // gets the department name and the sum of all the roles' salaries in that department
            const [results] = await connection.promise().query(`
            SELECT department.name AS department, SUM(role.salary) AS total_budget 
            FROM employee
            INNER JOIN role 
            ON employee.role_id=role.id
            INNER JOIN department
            ON role.department_id=department.id
            WHERE department.id = ?`, [departmentResult[0].id])
           
            console.table(results)

            menuPrompt()
    
        } catch(err) {
            throw new Error(err)
        }

    })
}

// main menu
const menuPrompt = async () => {
    const answer = await inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "What do you want to do?",
            choices: ['View all departments', 'View all roles', 'View all employees', 'Add a department', 'Add a role', 'Add an employee', 'Update an employee role', 'Update an employee manager', 'View employees by manager', 'View employees by department', 'Delete departments, roles, and employees', 'View the total utilized budget of a department', 'Exit']
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
    } else if (answer.action === 'Update an employee manager') {
        updateEmployeeManager()
    } else if (answer.action === 'View employees by manager') {
        viewEmployeesByManager()
    } else if (answer.action === 'View employees by department') {
        viewEmployeesByDepartment()
    } else if (answer.action === 'Delete departments, roles, and employees') {
        deleteOption()
    } else if (answer.action === 'View the total utilized budget of a department') {
        totalBudget()
    } else {
        process.exit(0)
    }
}

menuPrompt()