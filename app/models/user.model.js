const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    email: String,
    password: String,
    token1: String,
    confirmationCode: String,
    role: String, // Store user role as a string
    isConfirmed: Boolean,
    date: Date,
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      },
     
    ],
    isVerified: { type: Boolean, default: false },
    otp: { type: String }
    
   
  })
);

module.exports = User;
