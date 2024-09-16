const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const hostelSchema = new mongoose.Schema({
    hostel_name: { type: String, required: true },
    hostel_type: { type: String, required: true },
    hostel_city: { type: String, required: true },
    hostel_area: { type: String, required: true },
    hostel_pin_code: { type: String, required: true },
    hostel_phone: { type: String, unique: true, required: true },
    hostel_mail: { type: String, required: true },
    hostel_owner_name: { type: String, required: true },
    hostel_password: { type: String, required: true },
    hostel_security_deposit: { type: Number, required: true },
    hostel_year: { type: Number, required: true }, // New field for the year of establishment
    hostel_owner_languages: { // New field for owner's languages
        telugu: { type: Boolean, default: false },
        hindi: { type: Boolean, default: false },
        english: { type: Boolean, default: false }
    },
    hostel_message: { type: String }, // New field for a custom message
    hostel_about: { type: String }, // New field for additional information about the hostel
    hostel_facilities: [{ type: String }], // New field for a list of facilities
    hostel_google_map_location: { type: String }, // New field for Google Map location
    sharing_prices: [{
        share_type: { type: String, required: true }, // e.g., '1_share', '2_share', etc.
        price: { type: Number, required: true }
    }],
    hostel_image: { type: String } // New field for storing base64-encoded image data
});

// Middleware to hash the password before saving
hostelSchema.pre('save', async function(next) {
    if (this.isModified('hostel_password')) {
        const salt = await bcrypt.genSalt(10);
        this.hostel_password = await bcrypt.hash(this.hostel_password, salt);
    }
    next();
});


  // Method to compare password
  hostelSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.hostel_password);
  };
  

module.exports = mongoose.model('Hostel', hostelSchema);
