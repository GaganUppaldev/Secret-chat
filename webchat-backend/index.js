const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import the CORS middleware
const User = require('./user'); // Import User schema
const bodyParser = require('body-parser');
const Message = require('./Message');

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

app.post('/adduser', async (req, res) => {
    const { loggedInUsername, userIdToAdd } = req.body;

    // Input validation
    if (!loggedInUsername) {
        return res.status(400).json({ message: "LOGIN USERNAME ISSUE" });
    }

    if (!userIdToAdd) {
        return res.status(400).json({ message: "OBJECT ID MISSING" });
    }

    try {
        // Check if logged-in user exists
        const loggedInUser = await User.findOne({ username: loggedInUsername });
        if (!loggedInUser) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if the user to add exists
        const contactUser = await User.findById(userIdToAdd);
        if (!contactUser) {
            return res.status(400).json({ message: "Contact user not found" });
        }

        // Ensure the contact is not already in the logged-in user's contacts list
        if (!loggedInUser.contacts.includes(contactUser._id)) {
            loggedInUser.contacts.push(contactUser._id);
            await loggedInUser.save();
            return res.status(200).json({ message: "User added to your contacts" });
        } else {
            return res.status(400).json({ message: "User is already in your contacts" });
        }

    } catch (err) {
        console.error('Error in /adduser:', err);
        return res.status(500).json({ error: 'Server error' });
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

//contacts endpoint
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


/*app.post('/chat-add', async (req, res) => {
    const { sender, receiver, messageText } = req.body;

    if (!sender) {
        return res.status(400).json({ message: "We can't find who is sender" });
    }

    if (!receiver) {
        return res.status(400).json({ message: "We can't find who is receiver" });
    }

    if (!messageText) {
        return res.status(400).json({ message: "We are unable to spot any kind of message written by you" });
    }

    /*const addMessage = async (sender, receiver, messageText) => {
        try {
            // Check if a message document already exists between the sender and receiver
            const existingMessage = await Message.findOne({ sender, receiver });
    
            if (existingMessage) {
                // If a message document exists, add a new message to the 'content' array
                existingMessage.content.push({ messageText, timestamp: new Date() });
    
                await existingMessage.save();
                console.log("Message added to existing conversation");
            } else {
                // If no message document exists, create a new one
                const newMessage = new Message({
                    sender,
                    receiver,
                    content: [{ messageText, timestamp: new Date() }],
                });
    
                await newMessage.save();
                console.log("New message conversation started");
            }
        } catch (error) {
            console.error("Error saving message:", error.message);
        }
    };
    

    

    if (sender || receiver) {
        const agent = await Message.findOne({ sender: sender, receiver: receiver });
        if (/*sender || receiver agent) {
            try {

                agent.content.push({ messageText });
                await agent.save();
                console.log("New message pushed")

                /*
                const add = new Message({ sender, receiver, content: messageText }); //here was an error
            
                await add.save();
                console.log("YOUR MESSAGE IS SAVED SIR");
                return res.status(200).json({ message: "Message is SENT" });
            } catch (error) {
                console.error("Error saving message:", error.message);
                return res.status(500).json({ message: "Internal server error." });
            }
        }
        if (!agent /*!sender || recevier) {
            try {
                const add_database = new Message({ sender, receiver, messageText });
                await add_database.save();
                return res.status(200).json({ message: "Your message is sent SIR" });
            } catch (error) {
                console.error("Error saving message:", error.message);
                return res.status(500).json({ message: "Internal server error." });
            }
        } else {
            console.log("ERROR IS OUT OF CONTEXT FROM THIS API SIR");
            return res.status(400).json({ message: "ERROR IS OUT OF CONTEXT FROM THIS API SIR" });
        }
    }
});



*/


app.post('/chat-add', async (req, res) => {
    const { sender, receiver, messageText } = req.body;

    if (sender && receiver) {
        try {
            // Find the sender
            const agent = await User.findOne({ username: sender });
            if (!agent) {
                return res.status(400).json({ message: "Invalid sender username." });
            }
            const id_A = agent._id;
            console.log("Sender ObjectId:", id_A);

            const senderContacts = agent.contacts; // Sender's contacts array
            console.log("Sender's Contacts:", senderContacts);

            // Find the receiver
            const agent_2 = await User.findOne({ username: receiver });
            if (!agent_2) {
                return res.status(400).json({ message: "Receiver username not found on the server." });
            }
            const id_B = agent_2._id;
            console.log("Receiver ObjectId:", id_B);

            // Check if receiver is already in sender's contacts
            const contact = senderContacts.find(
                //contact => contact.type.toString() === id_B.toString()
                contact => contact?.type?.toString() === id_B.toString()
            );

            if (contact && contact.chatid) {
                console.log("Chat ID exists, we can push messageText into it.");
                // Logic to push messageText into the existing chat
            } else {
                console.log("No chat ID found, creating a new chat.");
                // Create a new chatId and update both sender and receiver contacts

                /*
                const newChatId = new mongoose.Types.ObjectId();

                // Update sender's contacts
                agent.contacts.push({ type: id_B, chatid: newChatId });
                await agent.save();

                // Update receiver's contacts
                agent_2.contacts.push({ type: id_A, chatid: newChatId });
                await agent_2.save();

                console.log("New chat ID created and updated for both users:", newChatId);*/
            }

        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    } else {
        return res.status(400).json({ message: "Sender and receiver are required." });
    }
});




app.get('/chat-history', async (req, res) => {
    const { sender, receiver } = req.query;

    // Validate sender and receiver are provided
    if (!sender || !receiver) {
        return res.status(400).json({ message: "Sender and receiver must be provided" });
    }

    try {
        // Fetch the message conversation between sender and receiver, or receiver and sender
        const agent = await Message.findOne({
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ]
        });

        if (!agent) {
            return res.status(404).json({ message: "No conversation found between the sender and receiver" });
        }

        // Return the messages (content array)
        return res.status(200).json({ messages: agent.content });
    } catch (error) {
        console.error("Error fetching messages:", error.message);
        return res.status(500).json({ message: "Internal server error." });
    }
});






// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
