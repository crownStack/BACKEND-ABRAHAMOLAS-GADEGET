const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: String,
    firstName: String,
    lastName: String, 
    homeAddress: String,
    town: String, 
    state: String, 
    country: String, 
    contact: String,
    password: String,
    createPassword: String,
    comfirmPasssword: String
});

module.exports = mongoose.model('User', userSchema);