const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    contacts: [{
         type: mongoose.Schema.Types.ObjectId, ref: 'User' ,
         chatid : {type :string}
    }
        //{ type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
        
    ]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
