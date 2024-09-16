// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const Hostel = require('../models/adminModels/Hostel'); // Assuming your model is in the models folder

const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt'); // Make sure to provide the correct path



// Get hostels by city
router.get('/hostels', async (req, res) => {
    const { city } = req.query;

    try {
        // Find hostels based on the city parameter
        const hostels = await Hostel.find({ hostel_city: city });
        res.json(hostels);
    } catch (error) {
        console.error('Error fetching hostels:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Route to get hostel details by ID
router.get('/hostel/:id', async (req, res) => {
    try {
        const hostelId = req.params.id;
        const hostel = await Hostel.findById(hostelId);

        if (!hostel) {
            return res.status(404).json({ message: 'Hostel not found' });
        }
       


        res.status(200).json(hostel);
        // console.log(hostel);
    
    } catch (error) {
        console.error('Error fetching hostel details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
