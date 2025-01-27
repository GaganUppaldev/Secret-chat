

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import the CORS middleware
const User = require('./user'); // Import User schema
const bodyParser = require('body-parser');
const Message = require('./Message');
const { createServer } = require("http");
const { Server } = require("socket.io");
const Activeuser = require("./Activeuser");

const app = express();
const port = 4000;

app.use(bodyParser.json());

// Enable CORS for localhost:3000
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests only from localhost:3000
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

// Create HTTP server for WebSocket and Express
const httpServer = createServer(app);

// Set up WebSocket server
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

io.on('connection', (socket) => {
    console.log("Client is connected");

    let user = null;

    socket.on("AccountID", async (S_user) => {
        user = S_user;
        console.log("Received username:", user);

        try {
            const agent = await Activeuser.findOne({ username: user });
            if (!agent) {
                const newAgent = new Activeuser({ username: user });
                await newAgent.save();
                console.log("User added to database:", user);
            } else {
                console.log("User already exists in the database:", user);
            }
        } catch (err) {
            console.error("Error adding user to the database:", err);
        }
    });

    socket.on('message', async (data) => {
        try {
            const { S_user, R_user, messageText } = data;
            console.log('Data received:'); //just kept here to check
            console.log(`Sender: ${S_user}`);
            console.log(`Receiver: ${R_user}`);
            console.log(`Message: ${messageText}`);
    
            const agent = await User.findOne({ username: S_user });
            if (!agent) {
                return res.status(402).json({ message: "We are not able to find your user id from our database" });
            }
    
            const S_id = agent.id;
    
            const agent0 = await User.findOne({ username: R_user });
            if (!agent0) {
                return res.status(402).json({ message: "We are not able to find your contact in our database" });
            }
            const R_id = agent0.id;
    
            // Find Receiver's id in the chat_id section of User's contacts (sender's contacts)
            const contact = agent.contacts.find(contact => contact.S_id.toString() === R_id.toString());
    
            if (contact && contact.chatid) {
                const existingChat = await Message.findById(contact.chatid);
                if (existingChat) {
                    existingChat.content.push({ messageText, timestamp: new Date(), sender: S_user });
                    await existingChat.save();
                    return res.status(200).json({ message: "Message added to existing chat." });
                } else {
                    return res.status(400).json({ message: "Chat ID not found in database." });
                }
            } else {
                // Create new chat
                const newChat = await Message.create({
                    sender: S_user,
                    receiver: R_user,
                    content: [{ messageText, timestamp: new Date() }]
                });
    
                if (!newChat) {
                    return res.status(500).json({ message: "Failed to create new chat." });
                }
    
                // Update sender's contacts
                agent.contacts.push({ userId: R_id, chatid: newChat._id });
                await agent.save();
    
                // Update receiver's contacts
                agent0.contacts.push({ userId: S_id, chatid: newChat._id });
                await agent0.save();
    
                return res.status(200).json({ message: "New chat created and updated in contacts." });
            }
        } catch (error) {
            console.error('Error parsing message:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });
    
    
      socket.on('close', () => {
        console.log('Client disconnected');
      });
    

    socket.on('disconnect', async () => {
        if (user) {
            console.log("Disconnected user:", user);
            try {
                const deleteResult = await Activeuser.deleteOne({ username: user });
                if (deleteResult.deletedCount > 0) {
                    console.log("User deleted from database:", user);
                } else {
                    console.log("User not found in the database:", user);
                }
            } catch (err) {
                console.error("Error handling disconnection:", err);
            }
        }
    });
});
    

    //});

    // Handle incoming messages
    /*socket.on("message", (data) => {
        console.log(`Message from client: ${data}`);

        // Broadcast message to all connected clients
        io.emit('message', data);
    });*/


// Define Home route
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
                    id: user._id //object id of user
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
        const { user1 } = req.body; // Extract username from the request body

        if (!user1) {
            return res.status(400).json({ message: "Username is required." });
        }

        const loggedInUser = await User.findOne({ username: user1 });

        if (!loggedInUser) {
            return res.status(404).json({ message: "User not found." });
        }

        if (loggedInUser.contacts.length > 0) {
            // Extract user IDs from the contacts array
            const userIds = loggedInUser.contacts.map(contact => contact.userId);

            try {
                // Fetch usernames of all contacts
                const contacts = await User.find({ _id: { $in: userIds } })
                    .select('username -_id') // Fetch only the `username` field
                    .lean(); // Convert Mongoose documents to plain objects

                const usernames = contacts.map(contact => contact.username);
                return res.status(200).json({ usernames });
            } catch (error) {
                console.error(`Error fetching contacts for user ${loggedInUser._id}:`, error.message);
                return res.status(500).json({ message: "Error fetching contacts." });
            }
        } else {
            return res.status(200).json({ message: "No contacts found." });
        }
    } catch (error) {
        console.error('Error in /contacts:', error);
        return res.status(500).json({ message: "Internal server error." });
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
    //# Need to req body of one more varibale named sender1 to add it in sender1 : data schema with messageText
    if (sender && receiver) {
        try {
            // Find sender
            const agent = await User.findOne({ username: sender });
            if (!agent) {
                return res.status(400).json({ message: "Invalid sender username." });
            }
            const id_A = agent._id;

            // Find receiver
            const agent_2 = await User.findOne({ username: receiver });
            if (!agent_2) {
                return res.status(400).json({ message: "Receiver username not found on the server." });
            }
            const id_B = agent_2._id;

            // Check if receiver is in sender's contacts
            const contact = agent.contacts.find(
                contact => contact?.userId?.toString() === id_B.toString()
            );

            if (contact && contact.chatid) {
                const existingChat = await Message.findById(contact.chatid);
                if (existingChat) {
                    existingChat.content.push({ messageText, timestamp: new Date() , sender1: sender});//added variable to add
                    await existingChat.save();
                    return res.status(200).json({ message: "Message added to existing chat." });
                } else {
                    return res.status(400).json({ message: "Chat ID not found in database." });
                }
            } else {
                // Create new chat
                const newChat = await Message.create({
                    sender,
                    receiver,
                    content: [{ messageText, timestamp: new Date() }]
                });

                if (!newChat) {
                    return res.status(500).json({ message: "Failed to create new chat." });
                }

                // Update sender's contacts
                agent.contacts.push({ userId: id_B, chatid: newChat._id  });//in UserID i am sending recevviers's id
                await agent.save();

                // Update receiver's contacts
                agent_2.contacts.push({ userId: id_A, chatid: newChat._id });
                await agent_2.save();

                return res.status(200).json({ message: "New chat created and updated in contacts." });
            }
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    } else {
        return res.status(400).json({ message: "Sender and receiver are required." });
    }
});  

app.post('/chat-history', async (req, res) => {
    const { sender, receiver } = req.body;

    // Validate sender and receiver are provided
    if (!sender || !receiver) {
        return res.status(400).json({
            success: false,
            message: "Sender and receiver must be provided."
        });
    }

    try {
        // Fetch sender and receiver from the database
        const senderUser = await User.findOne({ username: sender });
        const receiverUser = await User.findOne({ username: receiver });

        if (!senderUser) {
            return res.status(404).json({
                success: false,
                message: `Sender "${sender}" not found.`
            });
        }
        if (!receiverUser) {
            return res.status(404).json({
                success: false,
                message: `Receiver "${receiver}" not found.`
            });
        }

        const receiverId = receiverUser._id;

        // Find the chat details in sender's contacts
        const contact = senderUser.contacts.find(contact =>
            contact?.userId?.toString() === receiverId.toString()
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "No chat found between the specified users."
            });
        }

        // Retrieve the chat messages using the chat ID
        const chatHistory = await Message.findById(contact.chatid);

        if (!chatHistory) {
            return res.status(404).json({
                success: false,
                message: "No messages found for the given chat ID."
            });
        }

        // Extract and format the messages
        const messages = chatHistory.content.map(entry => ({  
            messageText: entry.messageText,
            timestamp: entry.timestamp,
            sender1 : entry.sender1
        }));

        // Respond with the chat history
        return res.status(200).json({
            success: true,
            message: "Chat history retrieved successfully.",
            chat: {
                sender: chatHistory.sender,
                receiver: chatHistory.receiver,
                messages // Corrected format
            },
        });

    } catch (error) {
        console.error("Error retrieving chat history:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving chat history.",
            error: error.message
        });
    }
});

app.post("/verify_activeuser", async (req, res) => {
    const { receiver } = req.body;

    try {
        const agent = await Activeuser.findOne({ username: receiver });
        if (!agent) {
            console.log("No active user, so use RESTful API");
            return res.status(402).json({ message: "No active user found." });
        }
        if (agent) {
            console.log("Active user, so use WebSockets API");
            return res.status(200).json({ message: "Active user found." });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});






// Start the server
httpServer.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
