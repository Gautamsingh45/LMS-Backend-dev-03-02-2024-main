const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const nodemailer = require("nodemailer"); 
const randomstring = require('randomstring');

const { v4: uuidv4 } = require('uuid');
var jwt = require("jsonwebtoken");

// var bcrypt = require("bcryptjs");
var bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'gautamsingh893591@gmail.com',
      pass: 'tcdencsoubsnhymc'
  }
}); 

exports.signup = async (req, res) => {
  const { firstName, lastName, username, email, password, role } = req.body;
  let otp = randomstring.generate(6); // Generate a 6-digit OTP by default

  try {
    // Check if the user already exists and is verified
    const existingUser = await User.findOne({ email, isVerified: true });
    if (existingUser) {
      // If the user already exists and is verified, return an error
      res.status(500).render('register', { errorMessage: "User with this email already exists and is verified." });
      // return res.status(400).send('User with this email already exists and is verified.');
    }

    // Check if the user already exists but is not verified
    const existingUnverifiedUser = await User.findOne({ email, isVerified: false });
    if (existingUnverifiedUser) {
      // If the user already exists but is not verified, resend the existing OTP
      otp = existingUnverifiedUser.otp;
    } else {
      // Create a new user with email verification status set to false
      const user = new User({
        firstName,
        lastName,
        username,
        email,
        password: bcrypt.hashSync(password, 8),
        role,
        isVerified: false,
        otp
      });
      
      const savedUser = await user.save();

      if (req.body.roles) {
        const roles = await Role.find({ name: { $in: req.body.roles } });
        savedUser.roles = roles.map((role) => role._id);
      } else {
        const defaultRole = await Role.findOne({ name: "user" });
        savedUser.roles = [defaultRole._id];
      }

      await savedUser.save();
    }

    // If the user already exists but is verified, or a new user is created, proceed to send OTP
    // Send OTP to user's email
    const mailOptions = {
      from: 'your.email@gmail.com',
      to: email,
      subject: 'Email Verification OTP',
      text: `Your OTP for email verification is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
      } else {
        console.log('Email sent:', info.response);
        res.render('verify', { email });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('register', { errorMessage: "Failed!" });
  }
};



exports.verify = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.isVerified === false) {
      if (otp === user.otp) {
        // Update user's verification status
        user.isVerified = true;
        await user.save();

        // Check if the user's role matches any of the specified roles for admin access
        if (user.role === "LNCT University - [LNCTU], Bhopal" || user.role === "Technocrats Institute of Technology - [TIT] (Excellence), Bhopal" ||  user.role === "Sagar Institute of Research and Technology - [SIRT], Bhopal" ) {
          return res.redirect(`/admin/${user._id}`);
        } else {
          return res.redirect(`/home/${user._id}`);
        }
      } else {
        res.status(400).send('Incorrect OTP. Please try again.');
      }
    } else {
      res.status(400).send('User not found or already verified.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error verifying email');
  }
};

exports.signin = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Find a user by username or email
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    }).populate("roles", "-__v");

    // If no user is found, return an error
    if (!user) {
      return res.status(400).render('register', { errorMessage: "User not found." });
    }

    // Check if the user's email is verified
    if (!user.isVerified) {
      return res.status(400).render('register', { errorMessage: "Email is not verified." });
    }

    // Check if the provided password is valid
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(400).render('register', { errorMessage: "Invalid password." });
    }

    // Check if the user is an admin based on their username
    if (user.username === "Admin") {
      return res.render('adminRegister');
    }

    // Redirect the user to the appropriate page based on their role
    if (user.role === "LNCT University - [LNCTU], Bhopal" || user.role === "Technocrats Institute of Technology - [TIT] (Excellence), Bhopal" || user.role === "Sagar Institute of Research and Technology - [SIRT], Bhopal" ) {
      return res.redirect(`/admin/${user._id}`);
    } else {
      return res.redirect(`/home/${user._id}`);
    }
  } catch (err) {
    console.error(err);
    res.status(400).render('register', { errorMessage: "Invalid username or password." });
  }
};