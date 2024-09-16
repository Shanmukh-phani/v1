// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Buddie = require('../../models/adminModels/Buddie'); // Assuming your Room model is in the models folder
const Payment = require('../../models/adminModels/Payment'); // Adjust the path as necessary
const Complaint = require('../../models/adminModels/Complaint'); // Adjust the path as necessary

const jwt = require('jsonwebtoken');
const path = require('path');

const  {generateToken}  = require('./auth');
const verifyToken = require('./verifyToken'); // Make sure to provide the correct path
const bcrypt = require('bcrypt');


router.post('/login', async (req, res) => {
  const { buddie_contact, buddie_password } = req.body;
  // console.log(buddie_contact,buddie_password);

  try {
    // Find Buddie by contact number
    const buddie = await Buddie.findOne({ buddie_contact });

    // If Buddie doesn't exist, return error
    if (!buddie) {
      return res.status(400).json({ message: 'Not exists' });
    }

    // Directly compare the provided password with stored password
    // console.log(buddie.buddie_password)
    const isMatch = buddie.buddie_password === buddie_password; // Direct comparison
    // console.log(`Password match: ${isMatch}`); // Debugging line

    // If password doesn't match, return error
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid contact number or password' });
    }

    // Generate JWT token
    const token = generateToken(buddie._id);

    // Return token and Buddie ID in the response
    res.json({ token, buddie_id: buddie._id });

  } catch (error) {
    console.error('Login error:', error); // Log the error for debugging purposes
    res.status(500).json({ message: 'Server error' });
  }
});



// Get buddie profile by buddie_id
router.get('/buddieProfile', verifyToken, async (req, res) => {
  const { buddie_id } = req.query;
  // console.log(buddie_id);
  try {
    if (!buddie_id) {
      return res.status(400).json({ message: 'BUddie ID is required' });
    }

    const buddie = await Buddie.findOne({ _id: buddie_id }); // Use findOne to get a single document

    if (!buddie) {
      return res.status(404).json({ message: 'Buddie not found' });
    }

    res.status(200).json(buddie);
  } catch (error) {
    console.error('Error fetching buddie:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update buddie profile by buddie_id
router.put('/updateBuddieProfile', verifyToken, async (req, res) => {
  const { buddie_id } = req.body;
  const updateData = req.body;

  try {
    if (!buddie_id) {
      return res.status(400).json({ message: 'Buddie ID is required' });
    }

    const buddie = await Buddie.findById(buddie_id); // Find the Buddie by ID

    if (!buddie) {
      return res.status(404).json({ message: 'Buddie not found' });
    }

    // Update buddie with the provided data
    Object.keys(updateData).forEach(key => {
      if (key !== 'buddie_id') {
        buddie[key] = updateData[key];
      }
    });

    await buddie.save(); // Save the updated buddie

    res.status(200).json(buddie);
  } catch (error) {
    console.error('Error updating buddie:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Route to get hostel_id for a specified Buddie
router.get('/getHostelId', verifyToken,async (req, res) => {
  const { buddie_id } = req.query; // Extract buddie_id from query parameters


  try {
    const buddie = await Buddie.findById(buddie_id).populate('hostel_id');
    if (!buddie) {
      return res.status(404).json({ message: 'Buddie not found' });
    }

    // console.log(buddie);
    res.json({ hostel_id: buddie.hostel_id._id }); // Return hostel_id
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});



// GET: Fetch payment history for a specific buddie
router.get('/payments', verifyToken,async (req, res) => {
  const { buddie_id } = req.query;

  try {
    // Fetch all payments associated with the buddie_id
    const payments = await Payment.find({ buddie_id }).sort({ date: -1 });
    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: 'No payments found' });
    }

    // Return the payments
    res.status(200).json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});




// POST: Submit a new payment request
router.post('/payments/request',verifyToken, async (req, res) => {
  const { buddie_id, amount, month, hostel_id } = req.body;

  try {
    // Check if a payment already exists for this month and buddie
    const existingPayment = await Payment.findOne({ buddie_id, month });
    if (existingPayment) {
      return res.status(400).json({ message: 'Rent for this month is already paid' });
    }

    // Create a new payment request
    const payment = new Payment({
      buddie_id,
      hostel_id,
      amount,
      month,
      date: new Date(), // Current date
    });

    await payment.save();
    res.status(200).json({ message: 'Payment request sent', payment });
  } catch (error) {
    console.error('Error processing payment request:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});


// Create a new complaint
router.post('/complaint', verifyToken, async (req, res) => {
  const { buddie_id,hostel_id, complaint_name, description,room_no } = req.body;

  try {
    const complaint = new Complaint({
      buddie_id,
      hostel_id,
      complaint_name,
      description,
      room_no
    });
    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all complaints for a hostel (Admin side)
router.get('/complaints', verifyToken, async (req, res) => {
  const { buddie_id } = req.query; // Extract buddie_id from query parameters
// console.log(buddie_id)
  try {
    const complaints = await Complaint.find({ buddie_id });
    res.json(complaints);
    // console.log(complaints);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;