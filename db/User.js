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
    createPassword: String,
    comfirmPasssword: String
});

module.exports = mongoose.model('User', userSchema);