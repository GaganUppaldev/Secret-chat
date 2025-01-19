const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username : {type : String },
});

const Activeuser = mongoose.model('Activeuser' , userSchema);
module.exports = Activeuser;

