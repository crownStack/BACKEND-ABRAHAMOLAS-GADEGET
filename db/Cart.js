const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    userEmail: {
        type: String,
        default: ''
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required: true
        },
        quantity: {
            type: Number,
            min: 1,
            required: true
        },
        delivery: {
            type: {
                type: String,
                enum: ['Pickup at the office', 'Home Delivery']
            },
            state: { type: String },
            lga: { type: String },
            address: { type: String },
            contact: { type: String }
        }
    }]
}, { timestamps: true })

module.exports = mongoose.model('Cart', cartSchema)