const inquirer = require('inquirer');
const mysql = require('mysql');
require('dotenv').config();

let departmentArr = [];
let roleArr = [];
let employeeArr = [];
const ID_OFFSET = 1;

const db_config = {
    host: process.env.DB_HOST,  
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DB,
}

const updateDepartmentArr = () => {
    return new Promise(resolve => {
        connection.query("SELECT name FROM department", (err, results) => {
            if (err) throw err;
            departmentArr = results.map(el => el.name);
            console.log(departmentArr);
            resolve();
        });
    });
}

const updateRoleArr = () => {
    return new Promise(resolve => {
        connection.query("SELECT title FROM role", (err, results) => {
            if (err) throw err;
            roleArr = results.map(el => el.title);
            console.log(roleArr);
            resolve();
        })
    })
}

const updateEmployeeArr = () => {
    return new Promise(resolve => {
        connection.query("SELECT first_name, last_name FROM employee", (err, results) => {
            if (err) throw err;
            
            employeeArr = results.map(el => `${el.first_name} ${el.last_name}`)
            
            resolve();
        })
    })
}

const connection = mysql.createConnection(db_config);

connection.connect( (err) => {
    if (err) throw err;
    connection.query("SELECT name FROM department", (err, results) => {
        // Cache information from database, to minimize number of accesses
        departmentArr = results.map(el => el.name);
        updateDepartmentArr()
        .then(updateRoleArr)
        .then(updateEmployeeArr)
        .then(menu);
    });
});

const addDepartment = () => {
    return inquirer.prompt([
        {
            type: "input",
            name: "department",
            message: "Department:"
        }
    ]).then(answers => ({table: "department", row: { name: answers.department }}))
}

const addRole = () => {
    return inquirer.prompt([
        {
            type: "input",
            name: "title",
            message: "Title:"
        },
        {
            type: "input",
            name: "salary",
            message: "Salary:"
        },
        {
            type: "list",
            name: "department",
            message: "Department:",
            choices: departmentArr
        }
    ]).then(answers => (
    {
        table: "role",
        row: {
            title: answers.title,
            salary: parseFloat(answers.salary),
            department_id: departmentArr.indexOf(answers.department) + ID_OFFSET
        }
    }
    ));
}

const addEmployee = () => {
    return inquirer.prompt([
        {
            type: "input",
            name: "firstName",
            message: "First Name:"
        },
        {
            type: "input",
            name: "lastName",
            message: "Last Name:"
        },
        {
            type: "list",
            name: "role",
            message: "Role:",
            choices: roleArr
        },
        {
            type: "list",
            name: "manager",
            message: "Manager:",
            choices: employeeArr

        }
    ]).then(answers => ({table: "employee", row: {
        first_name: answers.firstName,
        last_name: answers.lastName,
        role_id: roleArr.indexOf(answers.role) + ID_OFFSET,
        manager_id: employeeArr.indexOf(answers.manager) + ID_OFFSET
    }}))
}

const addRow = (data) => {
    const update = {
        "department" : () => updateDepartmentArr.then(menu),
        "role": () => updateRoleArr().then(menu),
        "employee": () => updateEmployeeArr().then(menu)
    }
    connection.query(`INSERT INTO ${data.table} SET ?`, data.row, (err) => {
        if (err) throw err;
        update[data.table]();
    })
}

const view = (table) => {
    const query = `SELECT * from ${table}`;
    connection.query(query, (err, results) => {
        if (err) throw err;
        console.table(results);
        menu();
    })
}

const viewDepartments = () => {
    const query = "SELECT name AS department FROM department";
    connection.query(query, (err, results) => {
        if (err) throw err;
        console.table(results);
        menu();
    })
}

const viewRoles = () => {
    const query = "SELECT r.title, r.salary, d.name FROM role r, department d WHERE r.department_id = d.id";
    connection.query(query, (err, results) => {
        if (err) throw err;
        console.table(results);
        menu();
    })
}

const viewEmployees = () => {
    const query = "SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, e.manager_id FROM employee e, role r, department d WHERE e.role_id = r.id AND d.id = r.department_id";
    connection.query(query, (err, results) => {
        if (err) throw err;
        const print = results.map(row => 
            ({
                first_name: row.first_name,
                last_name: row.last_name,
                title: row.title,
                department: row.department,
                salary: row.salary,
                manager: employeeArr[row.manager_id - ID_OFFSET] || "NONE"
            }));
        console.table(print);
        menu();
    });
}

const updateEmployeeRole = () => {
    return inquirer.prompt([
        {
            type: "list",
            name: "employee",
            message: "Employee:",
            choices: employeeArr
        },
        {
            type: "list",
            name: "role",
            message: "Change Role To:",
            choices: roleArr
        }
    ]).then(answers => (
        {
            table: "employee", 
            row: {
                role_id: roleArr.indexOf(answers.role) + ID_OFFSET
            },
            at: employeeArr.indexOf(answers.employee) + ID_OFFSET
    }))
}

const updateRow = (data) => {
    connection.query(`UPDATE ${data.table} SET ? WHERE id = ?`, [data.row, data.at], (err) => {
        if (err) throw err;
        menu();
    })
}

const deptNotFound = () => { console.log("No Existing Departments Found"); menu(); }
const roleNotFound = () => { console.log("No Existing Roles Found"); menu(); }


const actions = {
    "Add Department": () => addDepartment().then(addRow),
    "Add Role": () => departmentArr.length > 0 ? addRole().then(addRow) : deptNotFound,
    "Add Employee": () =>
        departmentArr.length > 0
            ? roleArr.length > 0
                ? addEmployee().then(addRow)
                : roleNotFound()
            : deptNotFound(),
    "View Departments": viewDepartments,
    "View Roles": viewRoles,
    "View Employees": viewEmployees,
    "Update Employee role": () => updateEmployeeRole().then(updateRow),
    "Quit App": () => connection.end()
}

const menu = () => {
    inquirer.prompt([{
        type: "list",
        name: "action",
        message: "Choose an action:",
        choices:[
            "Add Department",
            "Add Role",
            "Add Employee",
            "View Departments",
            "View Roles",
            "View Employees",
            "Update Employee role",
            "Quit App"
        ],
        pageSize: 10
    }]).then(results => {
        actions[results.action]();
    });  
}