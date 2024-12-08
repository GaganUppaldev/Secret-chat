const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import the CORS middleware
const User = require('./user'); // Import User schema
const app = express();
const port = 4000;

// Enable CORS for localhost:4000
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests only from localhost:4000
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    credentials: true // Enable cookies if needed
}));

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/webchat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Home route
app.get('/', (req, res) => {
    res.send('Welcome to the WebChat API!');
});

// Sign-up route
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username, password, and email are required.' });
    }

    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(200).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error saving user', error });
    }
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


