const { verifySignUp } = require("../middlewares");
const config = require("../config/auth.config");
const controller = require("../controllers/auth.controller");
const User = require('../models/user.model');
const Course = require('../models/courseModel');
const createClass= require('../models/createClass');
const Student= require('../models/attendanceStudent');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const db = require("../models");
const Role = db.role;
module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });


app.get('/', (req, res) => {
  errorMessage = '';
   res.render('register',{ errorMessage});
 
});

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

app.post("/verify",controller.verify);

app.post("/api/auth/signin", controller.signin);

app.get('/check-username/:username', async (req, res) => {
  const username = req.params.username;

  try {
      // Check if any user exists with the provided username (case-insensitive)
      const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
      if (existingUser) {
          res.send('This username is already registered &  verified .');
      } else {
          res.send('Username is available');
      }
  } catch (error) {
      // console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


app.get('/check-email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        res.send('Email is registered and verified');
      } else {
        res.send('Email is registered but not verified');
      }
    } else {
      res.send('Email is available');
    }
  } catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/check-username-email/:usernameOrEmail', async (req, res) => {
  const { usernameOrEmail } = req.params;
  try {
      const user = await User.findOne({
          $or: [
              { username: usernameOrEmail },
              { email: usernameOrEmail }
          ]
      });
      res.json({ exists: !!user });
  } catch (error) {
      // console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/home/:userId',async (req, res) => {
  const userId = req.params.userId;
  // You can use userId to fetch user data or render the appropriate content
  const user = await User.findById(userId).exec();
  res.render('home', { user, userId });
});

app.get('/about/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses1 = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Extract unique colleges from the courses1 array
    const uniqueColleges = [...new Set(courses1.map(course => course.college))];

    // Fetch createClass instances where the college matches any of the user's courses colleges
    const courses = await createClass.find({
      college: { $in: uniqueColleges },
    }).populate('user').exec();

    // console.log(courses);
    res.render('about', { user,courses, userId });
  } catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/:userId', async (req, res) => {
  const userId = req.params.userId;
  const courseId = req.query.courseId;

  try {
    const adminRole = await Role.findOne({ name: 'admin' }).exec();

    if (!adminRole) {
      return res.status(404).send('Admin role not found');
    }

    // Find the user by ID
    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(404).send('User not found');
    }

    const page = req.query.page || 1; // Get the requested page, default to 1
    const limit = 5;

    const search = req.query.search || '';

    // Find courses where the user has the 'admin' role and college name matches
    const courses = await Course.find({
      college: user.role, 
      $or: [
        { courseName: { $regex: '.*' + search + '.*', $options: 'i' } },
        { username: { $regex: '.*' + search + '.*', $options: 'i' } },
        { email: { $regex: '.*' + search + '.*', $options: 'i' } },
        { phone: { $regex: '.*' + search + '.*', $options: 'i' } },
        { college: { $regex: '.*' + search + '.*', $options: 'i' } },
        { graduation: { $regex: '.*' + search + '.*', $options: 'i' } },
        { status: { $regex: '.*' + search + '.*', $options: 'i' } },
      ],
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('user')
      .exec();

    const count = await Course.find({
      college: user.role,
      $or: [
        { courseName: { $regex: '.*' + search + '.*', $options: 'i' } },
        { username: { $regex: '.*' + search + '.*', $options: 'i' } },
        { email: { $regex: '.*' + search + '.*', $options: 'i' } },
        { phone: { $regex: '.*' + search + '.*', $options: 'i' } },
        { college: { $regex: '.*' + search + '.*', $options: 'i' } },
        { graduation: { $regex: '.*' + search + '.*', $options: 'i' } },
        { status: { $regex: '.*' + search + '.*', $options: 'i' } },
      ],
    }).countDocuments();

    const totalPages = Math.ceil(count / limit);

    const allCourses = await Course.find({ college: user.role}).exec();


    res.render('admin', {
      courses,
      user,
      userId,
      totalPages,
      currentPage: page,
      allCourses,
    });
  } catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/activate-course/:courseId', async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const updatedCourse = await Course.findByIdAndUpdate(courseId, { status: 'active' }, { new: true });

    if (!updatedCourse) {
      return res.status(404).json({ status: 'error', error: 'Course not found' });
    }

    res.json({ status: 'success', course: updatedCourse });
  } catch (error) {
    // console.error('Error activating course:', error);
    res.status(500).json({ status: 'error', error: 'Internal Server Error' });
  }
});


app.get('/confirmation', (req, res) => {
  res.render('confirmation');
});
app.get('/contact/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses = await Course.find({ user: userId }).exec();
    const course = await createClass.find({ user: userId }).exec();
    // console.log(course);
    const user = await User.findById(userId).exec(); 
    res.render('contact', { user,courses, userId });
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/courses/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
 
    const courses1 = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Extract unique colleges from the courses1 array
    const uniqueColleges = [...new Set(courses1.map(course => course.college))];

    // Fetch createClass instances where the college matches any of the user's courses colleges
    const courses = await createClass.find({
      college: { $in: uniqueColleges },
    }).populate('user').exec();

    res.render('courses', { courses, userId, user });
  } catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/playlist/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();
    
    res.render('playlist', {user, courses, userId });
    
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/playlist2/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();
    res.render('playlist2', {user, courses, userId });
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/playlist3/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();
    res.render('playlist3', {user, courses, userId });
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/profile/:userId',async (req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();
    res.render('profile', {user, courses, userId });
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/teacher_profile/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();
    res.render('teacher_profile', { user,courses, userId });
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/teachers/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();
    res.render('teachers', {user, courses, userId });
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/update/:userId', async(req, res) => {
  const userId = req.params.userId;
  try {
    // Fetch all courses for the specified user from the database
    const courses = await Course.find({ user: userId }).exec();
    const user = await User.findById(userId).exec();
    res.render('update', {user, courses, userId });
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/what', (req, res) => {
  res.render('what');
});

app.get('/logout', (req, res) => {
  errorMessage = '';
  res.render('register',{ errorMessage});
});



app.get('/course-form/:userId', async (req, res) => {
 
  
  try {
    
      // Fetch all users for the select box in the course form
      const userId = req.params.userId;
      
      const users = await User.find().exec();
      const user = await User.findById(userId).exec();   
    errorMessage = '';
      res.render('course-form', { user,users, userId , errorMessage});
  } catch (error) {
      // console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to handle course creation form submission
app.post('/create-course/:userId', async (req, res) => {
  const {firstName,lastName, username,email,phone,college,graduation,courseName,date, userId ,status} = req.body;

  try {
      // Check if the user exists
      const user = await User.findById(userId).exec();
      
      
      if (!user) {
          return res.status(404).send('User not found');
      }
          // Check if the courseName already exists
          const existingCourse = await Course.findOne({ courseName: courseName, username: username }).exec();

          if (existingCourse) {
            errorMessage = 'Course with this name and college already exists'; // Set errorMessage if course already exists
            return res.render('course-form', { user, userId, errorMessage });
          }


      const newCourse = new Course({
          firstName,
          lastName,
          username,
          email,
          courseName,
          phone,
          college,
          graduation,
           date,
           status,
          user: user._id,
          
          
      });

      await newCourse.save();
      if (req.body.roles) {
        const roles = await Role.find({ name: { $in: req.body.roles } });
        newCourse.roles = roles.map((role) => role._id);
      } else {
        const role = await Role.findOne({ name: "user" });
        newCourse.roles = [role._id];
      }
     
  
      await newCourse.save();
      // Redirect to a page or render a response as needed
      const courses = await Course.find({ user: userId }).exec();
      
      res.render('my-courses', { courses, user,userId });
  } catch (error) {
      // console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to render the "My Courses" page
app.get('/my-courses/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
      // Fetch all courses for the specified user from the database
      
      const courses = await Course.find({ user: userId }).exec();
      const user = await User.findById(userId).exec();
      res.render('my-courses', { courses, user,userId});
  } catch (error) {
      // console.error(error);
      res.status(500).send('Internal Server Error');
  }
});
app.get('/adminRegister',(req,res)=>{
  res.render('adminRegister')
})


//  create class online

app.get('/createClass/:userId',async(req,res)=>{
  try {
    
    // Fetch all users for the select box in the course form
    const userId = req.params.userId;
    
    const users = await User.find().exec();
  // Log the fetched classes to check if they are retrieved
    const user = await User.findById(userId).exec();
      //  console.log(user)
       errorMessage = '';
       res.render('createClass', { user,users, userId,errorMessage});
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
})


app.post('/createClass/:userId', async (req, res) => {
  const userId = req.params.userId;
  const {username ,college,graduation,courseName,time  } = req.body;

  try {
      // Check if the user exists
      // console.log('Received request with userId:', userId);
      const user = await User.findById(userId).exec();
      
      
      if (!user) {
          return res.status(404).send('User not found');
      }
      const newClass = new createClass({
          username,
          courseName,
          college,
          graduation,
           time,
           user: user._id,
        
          
          
      });

      await newClass.save();
      // req.session.newClassId = newClass._id;
      if (req.body.roles) {
        const roles = await Role.find({ name: { $in: req.body.roles } });
        newClass.roles = roles.map((role) => role._id);
      } else {
        const role = await Role.findOne({ name: "user" });
        newClass.roles = [role._id];
      }
     
  
      await newClass.save();
      // Redirect to a page or render a response as needed
      const users = await User.find().exec();
      res.status(400).render('createClass', { errorMessage: "Course created successfully!" ,user,userId,users});
  } catch (error) {
      // console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


app.get('/adminAttendance/:userId',async(req,res)=>{
  try {
    
    // Fetch all users for the select box in the course form
    const userId = req.params.userId;
    
    const users = await User.find().exec();
    const user = await User.findById(userId).exec();
      //  console.log(user)
       const courses = await Course.find({
              
              college: user.role
              
            }).populate('user').exec();


    
    res.render('adminAttendance', {courses, user,users, userId});
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
})

app.post('/submit-attendance/:userId', async (req, res) => {
  const { username,studentId, status } = req.body;
  const student = await Student.findById(studentId);

  if (student) {
    // Assuming you want to track attendance by date
    const currentDate = new Date();
    
    student.attendance.push({
      username:username,
      date: currentDate,
      status: status
    });

    await student.save();
  }

  res.send('Working')
});


app.get('/adminAssignment/:userId',async(req,res)=>{
  try {
    
    // Fetch all users for the select box in the course form
    const userId = req.params.userId;
    
    const users = await User.find().exec();
    const user = await User.findById(userId).exec();
      //  console.log(user)
       const courses = await Course.find({
              
              college: user.role
              
            }).populate('user').exec();


    
    res.render('adminAssignment', {courses, user,users, userId});
} catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
    
}
})


app.get('/adminContact/:userId',async(req,res)=>{
  try {
    
    // Fetch all users for the select box in the course form
    const userId = req.params.userId;
    
    const users = await User.find().exec();
  
    const user = await User.findById(userId).exec();
      //  console.log(user)
       const courses = await Course.find({
              
              college: user.role
              
            }).populate('user').exec();


    
    res.render('adminContact', {courses, user,users, userId});
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
})

app.get('/adminProfile/:userId',async (req, res) => {
  try {
    
    // Fetch all users for the select box in the course form
    const userId = req.params.userId;
    
    const users = await User.find().exec();
  
    const user = await User.findById(userId).exec();
      //  console.log(user)
       const courses = await Course.find({
              
              college: user.role
              
            }).populate('user').exec();


    
    res.render('adminProfile', {courses, user,users, userId});
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});
app.get('/adminUpdate/:userId',async (req, res) => {
  try {
    
    // Fetch all users for the select box in the course form
    const userId = req.params.userId;
    
    const users = await User.find().exec();
  
    const user = await User.findById(userId).exec();
      //  console.log(user)
       const courses = await Course.find({
              
              college: user.role
              
            }).populate('user').exec();


    
    res.render('adminUpdate', {courses, user,users, userId});
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
});


app.get('/attendance/:userId',async(req,res)=>{
  try {
    
    // Fetch all users for the select box in the course form
    const userId = req.params.userId;
    
    const users = await User.find().exec();
  
    const user = await User.findById(userId).exec();
      //  console.log(user)
       const courses = await Course.find({
              
              college: user.role
              
            }).populate('user').exec();


    
    res.render('attendance', {courses, user,users, userId});
} catch (error) {
    // console.error(error);
    res.status(500).send('Internal Server Error');
}
})



// update password
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      
      res.status(500).render('register', { errorMessage: "Invalid Email." });
    }

    // Generate a new random password
    const newPassword = Math.random().toString(36).slice(-8); // Generate a random 8-character password

    // Encrypt the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password in the database
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    // Send an email with the new password
    const transporter = nodemailer.createTransport({
     
      host: 'smtp.hostinger.com', // Your SMTP server host
      port: 465, // Your SMTP server port (usually 587 for TLS)
      secure: true, // Set to true if your SMTP server requires secure connection (TLS)
      auth: {
        user: 'help.saarthi@blockcept.ai', // Your SMTP username
        pass: 'Saarthi@1234' // Your SMTP password
    }
    });

    const mailOptions = {
      from: 'Gautam Singh <help.saarthi@blockcept.ai>',
      to: email,
      subject: 'Password Reset',
      text: `Your new password is: ${newPassword}` // This should be encrypted password
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        // console.log(error);
       
        return res.status(500).render('register', { errorMessage: 'Failed to send email' });
      } else {
        // console.log('Email sent: ' + info.response);
        
        return res.status(500).render('register', { errorMessage: "New password sent to your email" });
      }
    });
  } catch (error) {
    // console.log(error);
    
    return res.status(500).render('register', { errorMessage: 'Failed to reset password' });
  }
});

}