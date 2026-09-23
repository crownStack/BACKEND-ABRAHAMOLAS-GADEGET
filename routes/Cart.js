const express = require('express');
const Cart = require('../db/Cart');
const Products = require('../db/Products');

const router = express.Router();

router.post("/cart/products", async (req, res) => {
    try {
        const { cartId, userId, userEmail, productId, quantity = 1, delivery } = req.body;
        const requiredDeliveryFields = ['type', 'state', 'lga', 'address', 'contact'];
        const hasCompleteDelivery = delivery && requiredDeliveryFields.every(field => (
            typeof delivery[field] === 'string' && delivery[field].trim()
        )) && ['Pickup at the office', 'Home Delivery'].includes(delivery.type);

        if (!hasCompleteDelivery) {
            return res.status(400).json({ message: 'Complete delivery information is required' });
        }

        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const normalizedEmail = userEmail ? String(userEmail).trim().toLowerCase() : '';
        let cart = null;

        if (userId) {
            cart = await Cart.findOne({ userId });
        }

        if (!cart && normalizedEmail) {
            cart = await Cart.findOne({ userEmail: normalizedEmail });
        }

        // Reuse a guest cart when the user signs in after adding items.
        if (!cart && cartId) {
            cart = await Cart.findById(cartId);
        }

        if (!cart) {
            cart = new Cart({
                userId: userId || null,
                userEmail: normalizedEmail,
                items: []
            });
        }

        if (userId && !cart.userId) cart.userId = userId;
        if (normalizedEmail && !cart.userEmail) cart.userEmail = normalizedEmail;

        const existingItem = cart.items.find(item => item.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += Number(quantity);
            existingItem.delivery = delivery;
        } else {
            cart.items.push({ productId, quantity: Number(quantity), delivery });
        }

        await cart.save();
        res.status(201).json({ cartId: cart.id, message: 'Product added to cart' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.get("/cart/:cartId", async (req, res) => {
    try {
        const cart = await Cart.findById(req.params.cartId).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.json({
            items: cart.items.map(item => ({
                quantity: item.quantity,
                product: item.productId,
                delivery: item.delivery
            }))
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/cart/user/:email", async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email).trim().toLowerCase();
        const cart = await Cart.findOne({ userEmail: email }).populate('items.productId');

        if (!cart) {
            return res.json({ items: [] });
        }

        res.json({
            items: cart.items.map(item => ({
                quantity: item.quantity,
                product: item.productId,
                delivery: item.delivery
            })),
            cartId: cart.id
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router