const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import the CORS middleware
const User = require('./user'); // Import User schema
const bodyParser = require('body-parser');

const app = express();
const port = 4000;


app.use(bodyParser.json());

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

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body; // Get username and password from request body

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username }); // Find the user in the database

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.password === password) {
            // Send success response with username
            res.status(200).json({ success: true, message: 'Login successful', username: user.username });
        } else {
            res.status(401).json({ success: false, message: 'Incorrect password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST endpoint to search for a user
app.post('/usersearch', async (req, res) => {
    try {
        const { username } = req.body; // Extract username from request body

        // Check if username is provided
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Search for the user in the database
        const user = await User.findOne({ username });

        if (user) {
            // User found
            res.status(200).json({ 
                user: { 
                    name: username,  //user.name to username
                    id: user.id 
                } 
            });
        } else {
            // User not found
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Error in /usersearch:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Contacts Endpoint
app.post('/contacts', async (req, res) => {
    try {
        const { user1 } = req.body; // Changed from loggedInUsername to username

        console.log("Request received from:", { user1  }); // Updated here

        // Validate input
        if (!user1) { // Updated here
            return res.status(400).json({
                message: "We are unable to get your username for some reason. Please try again.",
            });
        }

        // Find the logged-in user
        const loggedInUser = await User.findOne({ username : user1 }); // Updated here
        if (!loggedInUser) {
            return res.status(404).json({ message: "User not found. Please try again." });
        }

        // Check if the user has contacts
        if (loggedInUser.contacts && loggedInUser.contacts.length > 0) {
            // Fetch usernames of all contacts
            const contacts = await User.find({ _id: { $in: loggedInUser.contacts } })
                .select('username -_id') // Fetch only the username field
                .lean(); // Convert Mongoose documents to plain objects

            const usernames = contacts.map(contact => contact.username);
            console.log("Contact Usernames:", usernames);

            //return res.status(200).json({ usernames: usernames }); 
            console.log("Returning Usernames:", usernames);
            return res.status(200).json({ usernames: usernames });
            

        } else {
            console.log("No contacts found for the logged-in user.");
            return res.status(200).json({ message: "No contacts found." });
        }
    } catch (error) {
        console.error("Error fetching contacts:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});




// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


