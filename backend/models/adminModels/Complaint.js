const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  buddie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Buddie', required: true },
  hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  room_no: { type: String, required: true }, // Added room_no field
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  complaint_name: { type: String, required: true },
});

module.exports = mongoose.model('Complaint', complaintSchema);
