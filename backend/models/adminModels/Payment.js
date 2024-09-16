const mongoose = require('mongoose');

// Define the payment schema
const paymentSchema = new mongoose.Schema({
  // Reference to the Buddie making the payment
  buddie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buddie',
    required: true
  },
  
  // Reference to the Hostel where the payment is made
  hostel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  
  // Amount of the payment
  amount: {
    type: Number,
    required: true
  },
  
  // Date of the payment, defaulting to the current date
  date: {
    type: Date,
    default: Date.now
  },
  
  // Status of the payment (e.g., pending, accepted, rejected)
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  
  // Month and year for which the payment is made (e.g., "January 2024")
  month: {
    type: String,
    required: true
  }
});

// Export the model
module.exports = mongoose.model('Payment', paymentSchema);
