const express = require('express');

const User = require('../../db/User');
const Cart = require('../../db/Cart');
const router = express.Router();
const passwordResetCodes = new Map();

const normalizeEmail = value => String(value || '').trim().toLowerCase();
const normalizeContact = value => String(value || '').replace(/\D/g, '');

router.post("/SignUp", async (req, res) => {
    const { email, firstName, lastName, homeAddress, town, state, country, contact } = req.body;

    if (!email || !firstName || !lastName || !homeAddress || !town || !state || !country || !contact) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedContact = normalizeContact(contact);

    if (!normalizedEmail.includes("@")) {
        return res.status(400).json({ error: "Valid Email with @ is required!!" });
    }

    if (normalizedContact.length !== 11) {
        return res.status(400).json({ error: "Contact number must be 11 digits" });
    }

    try {
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { contact: normalizedContact }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This email or phone number is already registered. Please sign in or reset your password.",
                user: {
                    email: existingUser.email,
                    contact: existingUser.contact
                }
            });
        }

        const user = new User({
            email: normalizedEmail,
            firstName,
            lastName,
            homeAddress,
            town,
            state,
            country,
            contact: normalizedContact
        });

        await user.save();

        return res.status(201).json({
            success: true,
            message: "SignUp successful",
            user: {
                email: normalizedEmail,
                firstName,
                lastName,
                homeAddress,
                town,
                state,
                country,
                contact: normalizedContact
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ error: "Unable to create account" });
    }
})

router.post('/Password', async (req, res) => {
    const { email, firstName, lastName, homeAddress, town, state, country, contact, password: submittedPassword, createPassword, confirmPassword } = req.body;
    const password = submittedPassword || createPassword;

    if (!email || !firstName || !lastName || !homeAddress || !town || !state || !country || !contact || !password) {
        return res.status(400).json({ error: "All signup details and password are required" });
    }

    if (!String(email).includes("@")) {
        return res.status(400).json({ error: "Valid Email with @ is required!!" });
    }

    if (String(contact).length !== 11) {
        return res.status(400).json({ error: "Contact number must be 11 digits" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must contain at least 6 digits" });
    }

    if (confirmPassword !== undefined && password !== String(confirmPassword)) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
        const existingUser = await User.findOne({ email: String(email).trim().toLowerCase() });

        if (existingUser) {
            existingUser.password = password;
            await existingUser.save();

            return res.status(201).json({
                success: true,
                message: "Password saved successfully",
                user: {
                    email,
                    firstName,
                    lastName,
                    homeAddress,
                    town,
                    state,
                    country,
                    contact,
                    createPassword: password
                }
            });
        }

        const user = new User({
            email,
            firstName,
            lastName,
            homeAddress,
            town,
            state,
            country,
            contact,
            password
        });

        await user.save();

        return res.status(201).json({
            success: true,
            message: "Password saved successfully",
            user: {
                email,
                firstName,
                lastName,
                homeAddress,
                town,
                state,
                country,
                contact,
                createPassword: password
            }
        });
    } catch (error) {
        console.error("Password save error:", error);
        return res.status(500).json({ error: "Unable to save password" });
    }
})


router.post('/SignIn', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({
            email: normalizedEmail,
            $or: [{ password }, { createPassword: password }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
})

router.get('/CurrentUser', async (req, res) => {
    const email = normalizeEmail(req.query.email);

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email }).select('_id email');

        if (!user) {
            return res.status(404).json({ message: 'User account no longer exists' });
        }

        return res.json({ exists: true });
    } catch (error) {
        console.error('Current user check error:', error);
        return res.status(500).json({ message: 'Unable to verify user account' });
    }
})

router.post('/ChangePassword', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must contain at least 6 characters' });
    }

    try {
        const user = await User.findOne({ email: String(email).trim().toLowerCase() });
        if (!user || (user.password || user.createPassword) !== currentPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ message: 'Unable to change password' });
    }
});

router.get('/admin/users-and-carts', async (req, res) => {
    try {
        const [users, carts] = await Promise.all([
            User.find({}).lean(),
            Cart.find({}).populate('items.productId').lean()
        ]);

        const rows = users.map(user => {
            const relatedCart = carts.find(cart => {
                const sameEmail = cart.userEmail && user.email && cart.userEmail.toLowerCase() === user.email.toLowerCase();
                const sameId = cart.userId && user._id && cart.userId.toString() === user._id.toString();
                return sameEmail || sameId;
            }) || null;

            return {
                user: {
                    _id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    homeAddress: user.homeAddress,
                    town: user.town,
                    state: user.state,
                    country: user.country,
                    contact: user.contact,
                    password: user.password || user.createPassword
                },
                cartItems: relatedCart ? relatedCart.items.map(item => ({
                    quantity: item.quantity,
                    productName: item.productId?.name || 'Product not found',
                    productPrice: item.productId?.price || 'N/A',
                    deliveryType: item.delivery?.type || 'N/A',
                    deliveryState: item.delivery?.state || 'N/A',
                    deliveryLga: item.delivery?.lga || 'N/A',
                    deliveryAddress: item.delivery?.address || 'N/A',
                    deliveryContact: item.delivery?.contact || 'N/A'
                })) : []
            };
        });

        res.json({
            users: rows,
            totalUsers: users.length,
            totalCarts: carts.length
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Unable to load admin dashboard data' });
    }
});

router.delete('/admin/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await Cart.deleteMany({
            $or: [
                { userId: user._id },
                { userEmail: user.email }
            ]
        });

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Unable to delete user' });
    }
});

router.post('/RequestPasswordReset', async (req, res) => {
    const identifier = String(req.body.identifier || '').trim().toLowerCase();
    if (!identifier) return res.status(400).json({ message: 'Email or contact number is required' });

    try {
        const user = await User.findOne({ $or: [{ email: identifier }, { contact: identifier }] });
        if (!user) return res.status(404).json({ message: 'No account was found with those details' });

        const code = String(Math.floor(100000 + Math.random() * 900000));
        passwordResetCodes.set(user.email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

        return res.json({
            success: true,
            message: 'Security code generated',
            email: user.email,
            code
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        return res.status(500).json({ message: 'Unable to request password reset' });
    }
});

router.post('/ResetPassword', async (req, res) => {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const reset = passwordResetCodes.get(normalizedEmail);

    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: 'All reset fields are required' });
    }
    if (!reset || reset.code !== String(code) || reset.expiresAt < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired security code' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must contain at least 6 characters' });
    }

    try {
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = newPassword;
        await user.save();
        passwordResetCodes.delete(normalizedEmail);

        return res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ message: 'Unable to reset password' });
    }
});

module.exports = router;