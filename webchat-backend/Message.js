/*const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    content: [{
        messageText: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    content: [{
        messageText: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        sender1:{type : String } //defined sender1 in database now
    }],
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
