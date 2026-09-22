require('dotenv').config();
const express = require("express");

const app = express();
const path = require("path");
const cors = require("cors");
require('./db/config');
const authRouter = require("./routes/admin/auth");
const productRouter = require("./routes/product");
const cartRouter = require("./routes/Cart");

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads')));

app.use(authRouter);
app.use(productRouter);
app.use(cartRouter);

app.get("/Home", (req, res) => {
    res.json({ MESSAGE: "WELCOME TO HOME PAGE" });
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening to port ${PORT}`);
})