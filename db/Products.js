const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    name: { 
        type: String,
        required: true,
    },
    price: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        default: "",
    },
    color: {
        type: String,
        default: "",
    },
    capacity: {
        type: String,
        default: "",
    },
    size: {
        type: String,
        default: "",
    },
    weight: {
        type: String,
        default: "",
    },
    rating: {
        type: Number,
        default: "",
    },
    stock: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    number: {
        type: Number,
        required: true
    }
},
    {
        timestamps: true,
    },
)

module.exports = mongoose.model("Products", productSchema);
