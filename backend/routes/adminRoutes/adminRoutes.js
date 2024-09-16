// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Hostel = require('../../models/adminModels/Hostel'); // Assuming your model is in the models folder
const Room = require('../../models/adminModels/Room'); // Assuming your Room model is in the models folder
const Buddie = require('../../models/adminModels/Buddie'); // Assuming your Room model is in the models folder
const FoodMenu = require('../../models/adminModels/FoodMenu');
const Payment = require('../../models/adminModels/Payment');
const Complaint = require('../../models/adminModels/Complaint');


const multer = require('multer');
const path = require('path');

const jwt = require('jsonwebtoken');

const { generateToken } = require('./auth');

const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const verifyToken = require('./verifyToken'); // Make sure to provide the correct path

let otpStorage = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'phanikumar0520@gmail.com', // Replace with your Gmail
        pass: 'qxvicvyrkyxjeoeg', // Replace with your Gmail password or App Password
    },
});

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Send OTP to email
router.post('/send-otp', (req, res) => {
    const { email } = req.body;
    const otp = generateOTP();
    otpStorage[email] = otp;

    const mailOptions = {
        from: 'phanikumar0520@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Error sending email');
        }
        res.send('OTP sent successfully');
    });
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStorage[email] === otp) {
        delete otpStorage[email];
        return res.send('OTP verified successfully');
    }
    res.status(400).send('Invalid OTP');
});



router.post('/create', async (req, res) => {

  try {
    // Check if hostel already exists by phone or email
    const existingHostel = await Hostel.findOne({
      $or: [
        { hostel_phone: req.body.hostel_phone },
        { hostel_mail: req.body.hostel_mail }
      ]
    });

    if (existingHostel) {
      return res.status(400).json({ message: 'Hostel with this phone number or email already exists' });
    }

    // Create new hostel
    const hostel = new Hostel(req.body);
    await hostel.save();
    res.status(201).send(hostel);
  } catch (error) {
    res.status(400).send(error);
  }
});





router.post('/login', async (req, res) => {
  const { hostel_phone, hostel_password } = req.body;

  try {
    const hostel = await Hostel.findOne({ hostel_phone });

    if (!hostel) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }

    const isMatch = await hostel.comparePassword(hostel_password);


    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid phone number or password' });
    }

    const token = generateToken(hostel._id);

    res.json({ token, hostel_id: hostel._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});



  // Apply middleware to the protected route
  router.get('/admin/dashboard', verifyToken, (req, res) => {
    // Protected route logic
  });


// Add Room
router.post('/addRoom', verifyToken, async (req, res) => {
  const { room_number, room_sharing, room_vacancy, hostel_id } = req.body;

  console.log('Received data:', { room_number, room_sharing, room_vacancy, hostel_id });

  // Validate required fields
  if (!room_number || !room_sharing || !room_vacancy || !hostel_id) {
    console.log('Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check if the hostel exists
    const hostel = await Hostel.findById(hostel_id);
    if (!hostel) {
      console.log('Hostel not found');
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Check for duplicate room_number within the specified hostel
    const existingRoom = await Room.findOne({ room_number, hostel_id });
    if (existingRoom) {
      console.log('Room already exists in this hostel');
      return res.status(400).json({ message: 'Room already exists in this hostel' });
    }

    // Create a new room
    const newRoom = new Room({
      room_number,
      room_sharing,
      room_vacancy,
      hostel_id,
    });

    // Save the room to the database
    await newRoom.save();

    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});  



  router.get('/rooms', verifyToken, async (req, res) => {
    const { hostel_id } = req.query;
  
    try {
      const rooms = await Room.find({ hostel_id });
  
      if (!rooms) {
        return res.status(404).json({ message: 'No rooms found' });
      }
  
      res.status(200).json(rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  
router.put('/updateRoom/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { hostel_id, room_number, room_sharing, room_vacancy } = req.body;

  try {
    // Check if a room with the same room_number already exists in the same hostel (excluding the current room)
    const existingRoom = await Room.findOne({
      hostel_id,
      room_number,
      _id: { $ne: id }, // Exclude the current room being updated
    });

    if (existingRoom) {
      return res.status(400).json({ message: 'A room with this number already exists in the hostel' });
    }

    // Update the room with the specified id and hostel_id
    const room = await Room.findOneAndUpdate(
      { _id: id, hostel_id },
      { room_number, room_sharing, room_vacancy },
      { new: true } // Return the updated room
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found or unauthorized' });
    }

    res.status(200).json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

  

  
  router.delete('/deleteRoom/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { hostel_id } = req.body;
  
    try {
      // Optional: Verify hostel_id from the token if you set it in req.user or req.body
      // const hostel_id_from_token = req.user.hostel_id; // Adjust according to your token verification logic
  
      // Find and delete the room with the provided id and hostel_id
      const room = await Room.findOneAndDelete({ _id: id, hostel_id });
  
      if (!room) {
        return res.status(404).json({ message: 'Room not found or unauthorized' });
      }
  
      res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

  
  router.post('/addBuddie', verifyToken, async (req, res) => {
    const {
      buddie_name, buddie_dob, buddie_gender, buddie_contact, buddie_email,
      buddie_profession, buddie_guardian_name, buddie_emergency_contact,
      buddie_id_proof, buddie_bike_no, buddie_photo, buddie_password, buddie_confirm_password, room_no, hostel_id,buddie_doj
    } = req.body;
  
    // Validate passwords
    if (buddie_password !== buddie_confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
  
    // Validate hostel_id
    if (!hostel_id) {
      return res.status(400).json({ message: 'Hostel ID is required' });
    }
  
    try {
      // Check if the hostel exists
      const hostel = await Hostel.findById(hostel_id);
      if (!hostel) {
        return res.status(404).json({ message: 'Hostel not found' });
      }
  
      // Check if a buddie with the same contact already exists in the specified hostel
      const existingBuddie = await Buddie.findOne({ buddie_contact, hostel_id });
      if (existingBuddie) {
        return res.status(400).json({ message: 'Buddie with this contact number already exists in this hostel' });
      }
  
      // Check room availability and update vacancy if a room is specified
      if (room_no) {
        const room = await Room.findOne({ room_number: room_no, hostel_id });
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }
        if (room.room_vacancy <= 0) {
          return res.status(400).json({ message: 'No vacancies available in the specified room' });
        }
  
        // Decrease room vacancy
        room.room_vacancy -= 1;
        await room.save();
      }
  
      // // Hash the password before saving
      // const salt = await bcrypt.genSalt(10);
      // const hashedPassword = await bcrypt.hash(buddie_password, salt);
  
      // Create and save the new buddie
      const newBuddie = new Buddie({
        buddie_name, buddie_dob, buddie_gender, buddie_contact, buddie_email,
        buddie_profession, buddie_guardian_name, buddie_emergency_contact,
        buddie_id_proof, buddie_bike_no, buddie_photo, buddie_password, hostel_id, room_no
      });
      const savedBuddie = await newBuddie.save();
  
      res.status(201).json(savedBuddie);
    } catch (error) {
      console.error('Error adding buddie:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  



  router.put('/updateBuddie/:id', verifyToken, async (req, res) => {
    const buddieId = req.params.id;
    const {
      buddie_name, buddie_contact, buddie_email,
      buddie_profession, buddie_emergency_contact,
      buddie_id_proof, buddie_bike_no, buddie_photo, hostel_id,
      room_no
    } = req.body;
  
    try {
      // Check if a buddie with the same contact already exists, excluding the current buddie
      const existingBuddie = await Buddie.findOne({ buddie_contact, _id: { $ne: buddieId }, hostel_id });
      if (existingBuddie) {
        return res.status(400).json({ message: 'Buddie with this contact number already exists in this hostel' });
      }
  
      // Find the current buddie
      const currentBuddie = await Buddie.findById(buddieId);
      if (!currentBuddie) {
        return res.status(404).json({ message: 'Buddie not found' });
      }
  
      // Check if the room has changed
      if (room_no && room_no !== currentBuddie.room_no) {
        // Increment vacancy in the old room
        if (currentBuddie.room_no) {
          await Room.findOneAndUpdate(
            { room_number: currentBuddie.room_no, hostel_id },
            { $inc: { room_vacancy: 1 } }
          );
        }
  
        // Decrement vacancy in the new room
        const newRoom = await Room.findOne({ room_number: room_no, hostel_id });
        if (!newRoom) {
          return res.status(404).json({ message: 'New room not found' });
        }
        if (newRoom.room_vacancy <= 0) {
          return res.status(400).json({ message: 'No vacancies available in the specified room' });
        }
  
        await Room.findOneAndUpdate(
          { room_number: room_no, hostel_id },
          { $inc: { room_vacancy: -1 } }
        );
      }
  
      // Prepare updates
      const updates = {
        buddie_name, buddie_contact, buddie_email,
        buddie_profession, buddie_emergency_contact,
        buddie_id_proof, buddie_bike_no, buddie_photo, hostel_id, room_no
      };
  
      // Perform the update
      const updatedBuddie = await Buddie.findOneAndUpdate(
        { _id: buddieId, hostel_id },
        updates,
        { new: true }
      );
  
      if (!updatedBuddie) {
        return res.status(404).json({ message: 'Buddie not found or hostel_id mismatch' });
      }
  
      res.status(200).json(updatedBuddie);
    } catch (error) {
      console.error('Error updating buddie:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  
  

 



  router.get('/buddies', verifyToken, async (req, res) => {
    const { hostel_id } = req.query;
  
    try {
      const buddies = await Buddie.find({ hostel_id });
  
      if (!buddies) {
        return res.status(404).json({ message: 'No buddies found' });
      }
  
      res.status(200).json(buddies);
    } catch (error) {
      console.error('Error fetching buddies:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });




  router.delete('/deleteBuddie/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { hostel_id } = req.body;
  
    try {
      // Find the buddie to be deleted
      const buddie = await Buddie.findOne({ _id: id, hostel_id });
  
      if (!buddie) {
        return res.status(404).json({ message: 'Buddie not found or unauthorized' });
      }
  
      // Increase the vacancy count in the associated room
      await Room.findOneAndUpdate(
        { room_number: buddie.room_no, hostel_id },
        { $inc: { room_vacancy: 1 } }
      );
  
      // Delete the buddie
      await Buddie.findOneAndDelete({ _id: id, hostel_id });
  
      res.status(200).json({ message: 'Buddie deleted successfully' });
    } catch (error) {
      console.error('Error deleting Buddie:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  




// Get hostel profile by hostel_id
router.get('/hostelProfile', verifyToken, async (req, res) => {
  const { hostel_id } = req.query;
  
  try {
    if (!hostel_id) {
      return res.status(400).json({ message: 'Hostel ID is required' });
    }

    const hostel = await Hostel.findOne({ _id: hostel_id }); // Use findOne to get a single document

    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    res.status(200).json(hostel);
  } catch (error) {
    console.error('Error fetching hostel:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update hostel profile by hostel_id
router.put('/updateHostelProfile', verifyToken, async (req, res) => {
  const { hostel_id } = req.body;
  const updateData = req.body;

  try {
    if (!hostel_id) {
      return res.status(400).json({ message: 'Hostel ID is required' });
    }

    const hostel = await Hostel.findById(hostel_id); // Find the hostel by ID

    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Update hostel with the provided data
    Object.keys(updateData).forEach(key => {
      if (key !== 'hostel_id') {
        hostel[key] = updateData[key];
      }
    });

    await hostel.save(); // Save the updated hostel

    res.status(200).json(hostel);
  } catch (error) {
    console.error('Error updating hostel:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Route to update hostel fees
router.put('/updateHostelFees', verifyToken, async (req, res) => {
  const { hostel_id, sharing_prices } = req.body;

  try {
    // Find the hostel by ID and update the sharing prices
    const hostel = await Hostel.findOneAndUpdate(
      { _id: hostel_id },
      { $set: { sharing_prices } },
      { new: true, runValidators: true }
    );

    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    res.status(200).json({ message: 'Prices updated successfully', hostel });
  } catch (error) {
    console.error('Error updating hostel fees:', error);
    res.status(500).json({ message: 'Failed to update prices', error });
  }
});


// PUT: Edit existing food menu
router.put('/update-foodMenu/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { food_menu } = req.body;

  try {
    const updatedFoodMenu = await FoodMenu.findByIdAndUpdate(
      id,
      { food_menu },
      { new: true } // Return the updated document
    );

    if (!updatedFoodMenu) {
      return res.status(404).json({ message: 'Food menu not found' });
    }

    res.status(200).json(updatedFoodMenu);
  } catch (error) {
    console.error('Error updating food menu:', error);
    res.status(500).json({ message: 'Error updating food menu' });
  }
});




// POST: Add new food menu
router.post('/add-foodMenu', verifyToken, async (req, res) => {
  const { hostel_id, food_menu } = req.body;

  try {
    const newFoodMenu = new FoodMenu({ hostel_id, food_menu });
    await newFoodMenu.save();
    res.status(201).json(newFoodMenu);
  } catch (error) {
    console.error('Error adding food menu:', error);
    res.status(500).json({ message: 'Error adding food menu' });
  }
});


router.put('/update-foodMenu/:id', verifyToken, async (req, res) => {
  const { id } = req.params;  // Ensure this is an ObjectId
  const { food_menu } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid food menu ID' });
  }

  try {
    const updatedFoodMenu = await FoodMenu.findByIdAndUpdate(
      id,
      { food_menu },
      { new: true }  // Return the updated document
    );

    if (!updatedFoodMenu) {
      return res.status(404).json({ message: 'Food menu not found' });
    }

    res.status(200).json(updatedFoodMenu);
  } catch (error) {
    console.error('Error updating food menu:', error);
    res.status(500).json({ message: 'Error updating food menu' });
  }
});



router.delete('/delete-foodMenu/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(400).json({ message: 'Invalid food menu ID' });
  // }

  try {
    const deletedFoodMenu = await FoodMenu.findByIdAndDelete(id);

    if (!deletedFoodMenu) {
      return res.status(404).json({ message: 'Food menu not found' });
    }

    res.status(200).json({ message: 'Food menu deleted successfully' });
  } catch (error) {
    console.error('Error deleting food menu:', error);
    res.status(500).json({ message: 'Error deleting food menu' });
  }
});



// GET: Fetch food menus by hostel_id
router.get('/FoodMenu/:hostel_id', async (req, res) => {
  try {
    const { hostel_id } = req.params;
    const foodMenus = await FoodMenu.find({ hostel_id });
    res.status(200).json(foodMenus);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching food menus' });
  }
});





// router.get('/dashboard', verifyToken, async (req, res) => {
//   const { hostel_id } = req.query;

//   try {
//     // Count the total number of rooms and buddies for the specified hostel
//     const totalRooms = await Room.countDocuments({ hostel_id });
//     const totalBuddies = await Buddie.countDocuments({ hostel_id });

//     // Fetch all rooms for the specified hostel
//     const rooms = await Room.find({ hostel_id });
//     // Calculate total vacancies by summing up room vacancies
//     const totalVacancies = rooms.reduce((acc, room) => acc + room.room_vacancy, 0);

//     // Send the response with the dashboard data
//     res.status(200).json({
//       totalRooms,
//       totalBuddies,
//       totalVacancies,
//     });
//   } catch (error) {
//     console.error('Error fetching dashboard data:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

router.get('/dashboard', verifyToken, async (req, res) => {
  const { hostel_id } = req.query;

  try {
    // Count the total number of rooms and buddies for the specified hostel
    const totalRooms = await Room.countDocuments({ hostel_id });
    const totalBuddies = await Buddie.countDocuments({ hostel_id });

    // Fetch all rooms for the specified hostel
    const rooms = await Room.find({ hostel_id });
    // Calculate total vacancies by summing up room vacancies
    const totalVacancies = rooms.reduce((acc, room) => acc + room.room_vacancy, 0);

    // Initialize counts for sharing types
    const sharingCounts = {};

    // Process rooms to calculate counts for each sharing type
    rooms.forEach(room => {
      const shareType = room.sharing_type; // Ensure this field matches your schema

      if (shareType) {
        if (!sharingCounts[shareType]) {
          sharingCounts[shareType] = 0;
        }
        sharingCounts[shareType] += 1;
      }
    });

    // Send the response with the dashboard data
    res.status(200).json({
      totalRooms,
      totalBuddies,
      totalVacancies,
      sharingCounts,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Endpoint to get the count of occupied rooms by sharing type
router.get('/sharing-count',verifyToken, async (req, res) => {
  try {
    // Aggregate the number of occupied rooms based on sharing type
    const result = await Room.aggregate([
      {
        $match: { room_vacancy: { $gt: 0 } } // Ensure we're counting only occupied rooms
      },
      {
        $group: {
          _id: "$room_sharing", // Group by sharing type
          totalOccupied: { $sum: { $subtract: ["$room_sharing", "$room_vacancy"] } } // Calculate number of occupied rooms
        }
      },
      {
        $sort: { _id: 1 } // Optional: Sort by sharing type
      }
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});





// Fetch top 5 facilities
router.get('/top-facilities', verifyToken, async (req, res) => {
  const { hostel_id } = req.query;

  try {
    // Fetch the hostel details
    const hostel = await Hostel.findById(hostel_id);

    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Count the frequency of each facility
    const facilityCounts = hostel.hostel_facilities.reduce((acc, facility) => {
      acc[facility] = (acc[facility] || 0) + 1;
      return acc;
    }, {});

    // Sort facilities by count and get top 5
    const topFacilities = Object.entries(facilityCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5);

    const formattedFacilities = topFacilities.map(([facility, count]) => ({
      name: facility,
      count
    }));

    console.log(formattedFacilities);

    res.json({ topFacilities: formattedFacilities });
  } catch (error) {
    console.error('Error fetching top facilities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// router.get('/payments/hostel/:hostelId',verifyToken, async (req, res) => {
//   const { hostelId } = req.params;

//   try {
//     const payments = await Payment.find({ hostel_id: hostelId }).populate('buddie_id');
//     res.status(200).json(payments);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// });


router.get('/payments/hostel/:hostelId',verifyToken, async (req, res) => {
  try {
    const { hostelId } = req.params;

    // Fetch payments based on hostelId
    const payments = await Payment.find({ hostel_id: hostelId });

    if (!payments) {
      return res.status(404).json({ message: 'No payments found for this hostel.' });
    }

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Accept a payment
router.put('/payments/:paymentId/accept', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).send('Payment not found');
    }

    if (payment.status === 'accepted') {
      return res.status(400).send('Payment already accepted');
    }

    payment.status = 'accepted';
    await payment.save();

    res.send('Payment accepted!');
  } catch (error) {
    console.error('Error accepting payment', error);
    res.status(500).send('Server Error');
  }
});


// Get Buddie's name by buddie_id
router.get('/buddie/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const buddie = await Buddie.findById(id).select('buddie_name');
    if (!buddie) {
      return res.status(404).json({ error: 'Buddie not found' });
    }

    res.json({ name: buddie.buddie_name });
  } catch (error) {
    console.error('Error fetching buddie details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Fetch complaints based on hostel_id
router.get('/complaints/:id', async (req, res) => {
  const { id } = req.params;
// console.log('data',id);
  try {

    const hostel = await Hostel.findById(id);
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const complaints = await Complaint.find({ hostel_id: id }).populate('buddie_id');
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Mark complaint as resolved
router.patch('/complaints/:id/resolve', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the complaint ID is valid
    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return res.status(400).json({ error: 'Invalid complaint ID' });
    // }

    // Find the complaint by ID
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check if the complaint is already resolved
    if (complaint.status === 'resolved') {
      return res.status(400).json({ error: 'Complaint is already resolved' });
    }

    // Mark the complaint as resolved
    complaint.status = 'resolved';
    await complaint.save();

    res.json({ message: 'Complaint resolved successfully' });
  } catch (error) {
    console.error('Error resolving complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
