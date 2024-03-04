const express = require("express");
const cors = require("cors");
const path = require('path');
const dbConfig = require("./app/config/db.config");
// adding
// const session = require('express-session');
const bodyParser = require('body-parser');
const ejs = require('ejs');

// ending
// mongodb://localhost:27017
const app = express();
// const mongoose = require('mongoose');
// const MongoStore = require('connect-mongo');

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;
// db.mongoose.connect("mongodb+srv://gautamsingh893591:V2jTulad1dfL6bE9@cluster0.vwrm2se.mongodb.net/student?retryWrites=true&w=majority")
// ejs server code
// db.mongoose.connect("mongodb+srv://gautamsingh893591:V2jTulad1dfL6bE9@cluster0.vwrm2se.mongodb.net/student?retryWrites=true&w=majority")
app.use(bodyParser.urlencoded({ extended: true }));



app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// db.mongoose.connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   })
db.mongoose.connect("mongodb+srv://gautamsingh893591:V2jTulad1dfL6bE9@cluster0.vwrm2se.mongodb.net/student?retryWrites=true&w=majority")
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });


  // const mongoStoreOptions = {
  //   mongoUrl: `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`,
  //   collection: 'sessions',
  // };

  // app.use(session({ secret: 'your-secret-key', resave: true,  saveUninitialized: true ,store: MongoStore.create(mongoStoreOptions)}));
// simple route
// app.get("/", (req, res) => { 
//   res.json({ message: "Welcome to bezkoder application." });
// });

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);


// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}
