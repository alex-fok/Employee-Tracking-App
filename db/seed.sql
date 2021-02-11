INSERT INTO department SET name = 'Sales';
INSERT INTO role SET title = 'Salesperson', salary = '80000', department_id = 1;
INSERT INTO role SET title = 'Sales Lead', salary = '100000', department_id = 1;

INSERT INTO employee SET first_name = 'Alice', last_name = 'A', role_id = 2;
INSERT INTO employee SET first_name = 'Bob', last_name = 'B', role_id = 1, manager_id = 1;
INSERT INTO employee SET first_name = 'Charlie', last_name = 'C', role_id = 1, manager_id = 1;
INSERT INTO employee SET first_name = 'Delta', last_name = 'D', role_id = 1, manager_id = 1;