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

const inquireDepartment = () => {
    return inquirer.prompt([
        {
            type: "input",
            name: "department",
            message: "Department:"
        }
    ]).then(answers => ({table: "department", row: { name: answers.department }}))
}

const inquireRole = () => {
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

const inquireEmployee = () => {
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
        manager_id: employeeArr.indexOf(answers.manager) < 0 ? null : employeeArr.indexOf(answers.manager) + ID_OFFSET
    }}))
}

const add = (data) => {
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

const deptNotFound = () => { console.log("No Existing Departments Found"); menu(); }
const roleNotFound = () => { console.log("No Existing Roles Found"); menu(); }

const updateEmployeeRole = () => {menu();}
const actions = {
    "Add Department": () => inquireDepartment().then(add),
    "Add Role": () => departmentArr.length > 0 ? inquireRole().then(add) : deptNotFound,
    "Add Employee": () =>
        departmentArr.length > 0
            ? roleArr.length > 0
                ? inquireEmployee().then(add)
                : roleNotFound()
            : deptNotFound(),
    "View Departments": () => view("department"),
    "View Roles": () => view("role"),
    "View Employees": () => view("employee"),
    "Update Employee role": updateEmployeeRole,
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