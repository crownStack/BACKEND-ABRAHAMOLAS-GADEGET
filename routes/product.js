const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Products = require('../db/Products');

const uploadsDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDirectory);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
}});

const upload = multer({ storage: storage });

router.get("/products", async (req, res) => {
    const products = await Products.find();

    res.json(products);
})

router.post("/products", upload.single("image"), async (req, res) => {
    const product = await Products.create({
      image: req.file ? req.file.filename : "",
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      brand: req.body.brand,
      color: req.body.color,
      capacity: req.body.capacity,
      size: req.body.size,
      weight: req.body.weight,
      rating: req.body.rating,
      stock: Number(req.body.stock) || 0,
      sold: Number(req.body.sold) || 0,
      number: Number(req.body.number)
    })

    res.json(product);
})

router.get("/products/:id", async (req, res) => {
    try {
        const product = await Products.findById(req.params.id);

        if(!product) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        res.json(product)
    }   catch (error) {
            res.status(500).json({
                message: error.message,
            })
        }
    })

router.put("/products/:id", upload.single("image"), async (req, res) => {
    try {
        const product = await Products.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const previousImage = product.image;
        const updates = {
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            brand: req.body.brand,
            color: req.body.color,
            capacity: req.body.capacity,
            size: req.body.size,
            weight: req.body.weight,
            stock: Number(req.body.stock) || 0,
            sold: Number(req.body.sold) || 0
        };

        if (req.file) {
            updates.image = req.file.filename;
        }

        const updatedProduct = await Products.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (req.file && previousImage) {
            const previousImagePath = path.join(uploadsDirectory, previousImage);
            if (fs.existsSync(previousImagePath)) fs.unlinkSync(previousImagePath);
        }

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message || "Unable to update product" });
    }
});

router.delete("/products/:id", async (req, res) => {
    try {
        const product = await Products.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.image) {
            const imagePath = path.join(uploadsDirectory, product.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message || "Unable to delete product" });
    }
});

module.exports = router;