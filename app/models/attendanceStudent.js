const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: String,
    email: String,
    phone: String,
  attendance: [{ date: Date, status: String }],
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


const attendanceStudent = mongoose.model('attendanceStudent', adminSchema);

module.exports = attendanceStudent;
