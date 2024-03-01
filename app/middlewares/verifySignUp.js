const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    const usernameUser = await User.findOne({ username: req.body.username });
    // const emailUser = await User.findOne({ email: req.body.email });

    if (usernameUser) {
      // Render the same registration page with an error message
      return res.status(400).render('register', { errorMessage: "Failed! Username is already in use!" });
    }
  
    // if (emailUser) {
    //   // Render the same registration page with an error message
    //   return res.status(400).render('register', { errorMessage: "Failed! Email is already in use!" });
    // }

    // if (usernameUser) {
    //   // res.status(400).send({ message: "Failed! Username is already in use!" });
    //   alert("Failed! Username is already in use!");
    //   // res.render('register');
    //   return;
    // }

    // if (emailUser) {
    //   alert("Failed! Email is already in use!");
    //   // res.status(400).send({ message: "Failed! Email is already in use!" });
    //   // res.render('register');
    //   return;
    // }

    next();
  } catch (err) {
    return res.status(500).render('register', { errorMessage: "Invalid Input" });
  }
};

checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`,
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

module.exports = verifySignUp;
