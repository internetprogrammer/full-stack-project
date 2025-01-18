const mongoose = require('mongoose');

const user = mongoose.Schema({
    username:String,
    password: String,
    refreshToken:String
});

const User = mongoose.model("User", user);
module.exports = User;