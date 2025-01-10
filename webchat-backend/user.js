/*const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    contacts: [{
         type: mongoose.Schema.Types.ObjectId, ref: 'User' ,
         chatid : mongoose.Schema.Types.ObjectId //converted from strng to mongoose object id
    }]
        //{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
module.exports = User; */

/*const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contacts: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        chatid: { type: mongoose.Schema.Types.ObjectId, required: true }
    }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;*/

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contacts: [{
        userId: { type: mongoose.Schema.Types.ObjectId, /*ref: 'User', required: true*/ },
        chatid: { type: mongoose.Schema.Types.ObjectId , }
    }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;


