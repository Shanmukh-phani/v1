// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/adminRoutes/adminRoutes');
const buddieRoutes = require('./routes/buddieRoutes/buddieRoutes');
const routes = require('./routes/routs');
require('dotenv').config(); // For loading environment variables

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON
// app.use(express.json());
app.use(cors()); // Enable CORS for all origins

// Increase the size limit for JSON payloads
app.use(express.json({ limit: '10mb' })); // Increase the limit as needed
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Increase the limit as needed

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI,{
    serverSelectionTimeoutMS: 30000 // Increase timeout to 30 seconds
}).then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB:', err));


// Use the admin routes
app.use('/admin', adminRoutes);
app.use('/buddie', buddieRoutes);
app.use('/',routes);

// Start the Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
