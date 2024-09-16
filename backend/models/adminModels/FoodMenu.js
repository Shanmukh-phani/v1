const mongoose = require('mongoose');

const foodMenuSchema = new mongoose.Schema({
  food_id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  food_menu: {
    type: String,  // This will store the base64 string
    required: true,
  },
  hostel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',  // Assuming you have a Hostel model
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('FoodMenu', foodMenuSchema);
