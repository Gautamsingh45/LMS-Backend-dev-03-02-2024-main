const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: String,
  courseName: String,
  college: String,
  graduation: String,
  time: { type: Date, default: Date.now },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  roles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role"
    },
   
  ],
});


const createClass = mongoose.model('createClass', adminSchema);

module.exports = createClass;
