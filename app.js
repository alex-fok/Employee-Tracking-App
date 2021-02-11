const inquirer = require('inquirer');
const mysql = require('mysql');
require('dotenv').config();

let departmentArr = [];
let roleArr = [];

const db_config = {
    host: process.env.DB_HOST,  
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DB,
}

const updateDepartmentArr = () => {
    return new Promise((resolve, reject) => {
        connection.query("SELECT name FROM department", (err, results) => {
            departmentArr = results.map(el => el.name);
            console.log(departmentArr);
            resolve();
        });
    });
}

const updateRoleArr = () => {
    return new Promise((resolve) => {
        connection.query("SELECT title FROM role", (err, results) => {
            roleArr = results.map(el => el.titles);
            console.log(roleArr);
            resolve();
        })
    })
}

const connection = mysql.createConnection(db_config);

connection.connect( (err) => {
    if (err) throw err;
    connection.query("SELECT name FROM department", (err, results) => {
        departmentArr = results.map(el => el.name);
        updateDepartmentArr().then(updateRoleArr).then(startApp);
    });
});

const inquireDepartment = () => {
    return inquirer.prompt([
        {
            type: "input",
            name: "department",
            message: "Department"
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
            type: "input",
            name: "department",
            message: "Department:"
        }
    ]).then(answers => ({
        title: answers.title,
        salary: parseFloat(answers.salary),
        department: deparmentsArr.indexOf(answers.department)
    }));
}

const inquireEmployee = () => {
    inquirer.prompt([
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
            type: "input",
            name: "manager",
            message: "Manager:"
        }
    ]).then(answers => ({table: "employee", row: {
        first_name: answers.firstName,
        last_name: answers.lastName,
        role_id: roleArr.indexOf(answers.role),
        manager_id: managerArr.indexOf(answers.manager) < 0 ? null : managerArr.indexOf(answers.manager)
    }}))
}

const add = (data) => {
    connection.query(`INSERT INTO ${data.table} SET ?`, data.row, (err) => {
        if (err) throw err;
    })
}

const view = (table) => {
    const query = `SELECT * from ${table}`;
    connection.query(query, (err, results) => {
        if (err) throw err;
        console.table(results)
    })
}

const deptNotFound = () => console.log("No Existing Departments Found");
const roleNotFound = () => console.log("No Existing Roles Found");

const updateEmployeeRole = () => {}
const actions = {
    "Add Department": () => inquireDepartment().then(add),
    "Add Role": () => department.length > 0 ? inquireRole.then(add) : deptNotFound,
    "Add Employee": () =>
        departmentArr.length > 0
            ? roleArr.length > 0
                ? inquireEmployee.then(add)
                : roleNotFound()
            : deptNotFound(),
    "View Deparments": () => view("department"),
    "View Roles": () => view("role"),
    "View Employees": () => view("employee"),
    "Update Employee role": updateEmployeeRole,
    "Quit": () => connection.end()
}

const startApp = () => {
    inquirer.prompt([{
        type: "list",
        name: "action",
        message: "Choose an action:",
        choices:[
            "Add Department",
            "Add Role",
            "Add Employee",
            "View Deparments",
            "View Roles",
            "View Employees",
            "Update Employee role"
        ]
    }]).then(results => {
        actions[results.action]();
    });  
}