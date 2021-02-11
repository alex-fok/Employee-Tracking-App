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

const connection = mysql.createConnection(db_config);

connection.connect( (err) => {
    if (err) throw err;
    
    startApp();
});
const view = (table) => {
    const query = `SELECT * from ${table}`;
    connection.query(query, (err, results) => {
        if (err) throw err;
        console.table(results)
    })
}


const updateEmployeeRole = () => {}
const actions = {
    "Add Department": () => {},
    "Add Role": () => {},
    "Add Employee": () => {},
    "View Deparments": () => view("department"),
    "View Roles": () => view("role"),
    "View Employees": () => view("employee"),
    "Update Employee role": updateEmployeeRole
}

const startApp = () => {
    inquirer.prompt([{
        type: "list",
        name: "action",
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