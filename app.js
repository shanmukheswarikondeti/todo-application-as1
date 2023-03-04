const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();

app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
//Scenario 1 Returns a list of all todos whose status is 'TO DO'
//Scenario 2 Returns a list of all todos whose priority is 'HIGH'
//Scenario 3 Returns a list of all todos whose priority is 'HIGH' and status is 'IN PROGRESS'
//Scenario 4 Returns a list of all todos whose todo contains 'Buy' text
//Scenario 5 Returns a list of all todos whose category is 'WORK' and status is 'DONE'
//Scenario 6 Returns a list of all todos whose category is 'HOME'
//Scenario 7 Returns a list of all todos whose category is 'LEARNING' and priority is 'HIGH'

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outputResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    //Scenario 1
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo
                                WHERE status='${status}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //Scenario 2
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo
                                WHERE priority='${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario 3
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo
                                     WHERE status='${status}' AND priority='${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario 4
    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo
                            WHERE todo LIKE '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outputResult(eachItem)));
      break;

    //Scenario 5
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo
                                    WHERE category='${category}' AND status='${status};`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 6
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo
                                    WHERE category='${category}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 7
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo
                                    WHERE category='${category}' AND status='${status};`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
});

//API 2
//Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo
                          WHERE id=${todoId};`;
  const responseResult = await database.get(getTodoQuery);
  response.send(outputResult(responseResult));
});

//API 3
//Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `SELECT * FROM todo
                              WHERE due_date='${newDate}';`;
    const responseResult = await database.all(requestQuery);
    response.send(responseResult.map((eachItem) => outputResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
//Create a todo in the todo table

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `INSERT INTO todo
                                           (id,todo,priority,status,category,due_date)
                                           VALUES(${id},
                                                   '${todo}',
                                                   '${priority}',
                                                   '${status}',
                                                   '${category}',
                                                   '${postNewDueDate}');`;
          await database.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
//Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo
                                WHERE id=${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    //Scenario 1 Update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo
                                   SET todo='${todo}',
                                        priority='${priority}',
                                        status='${status}',
                                        category='${category}',
                                        due_date='${dueDate}'
                                    WHERE id=${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //Scenario 2 Update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `UPDATE todo
                                   SET todo='${todo}',
                                        priority='${priority}',
                                        status='${status}',
                                        category='${category}',
                                        due_date='${dueDate}'
                                    WHERE id=${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario 3 Update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE todo
                               SET todo='${todo}',
                                    priority='${priority}',
                                    status='${status}',
                                    category='${category}',
                                    due_date='${dueDate}'
                                WHERE id=${todoId};`;
      await database.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    //Scenario 4 Update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo
                                   SET todo='${todo}',
                                        priority='${priority}',
                                        status='${status}',
                                        category='${category}',
                                        due_date='${dueDate}'
                                    WHERE id=${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 5 Update DueDate
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo
                                   SET todo='${todo}',
                                        priority='${priority}',
                                        status='${status}',
                                        category='${category}',
                                        due_date='${dueDate}'
                                    WHERE id=${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6
//Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
                             WHERE id=${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
