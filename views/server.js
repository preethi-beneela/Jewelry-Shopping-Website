const express = require('express');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');  // For password hashing
const session = require('express-session');
const MongoStore = require('connect-mongo');  // For session storage in MongoDB
const User = require('./User');  // Import the User model

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());  // Middleware for handling file uploads
app.use(express.static(path.join(__dirname, 'views')));  // Serve static files

// MongoDB URI
const mongoURI = 'mongodb://localhost:27017/products';

// Create MongoDB connection
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const conn = mongoose.createConnection(mongoURI);

// Initialize GridFS stream for file uploads
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');  // Collection where files will be stored
});

// Session middleware with MongoDB store
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: mongoURI }),  // Store sessions in MongoDB
    cookie: { secure: false }  // Set to true if using HTTPS
}));

// Serve static files from 'views' folder
app.use(express.static(path.join(__dirname, 'views')));

// Serve static files from 'images' folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Route to render index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Products route: Fetch products from the database
app.get('/products', async (req, res) => {
    try {
        const products = await conn.collection('products').find({}).toArray();
        res.json(products);  // Return products as JSON
    } catch (error) {
        console.error(error);  // Log error to console
        res.status(500).json({ message: 'Error fetching products', error });
    }
});



// Route to serve eyeglasses.html
app.get('/prod', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'eyeglasses.html'));
});

// User authentication routes

// SIGN UP Route
app.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);  // Hash password
        const user = new User({
            fname: firstName + ' ' + lastName,
            email: email,
            password: hashedPassword
        });
        await user.save();

        req.session.user = user;  // Save user session

        res.redirect('/');  // Redirect to homepage after sign-up
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error signing up', error });
    }
});

// SIGN IN Route
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        req.session.user = user;  // Save user session

        res.redirect('/');  // Redirect to homepage after sign-in
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error signing in', error });
    }
});

// Fetch the current user's session
app.get('/current-user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user.name });
    } else {
        res.json({ user: null });
    }
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout error', error: err });
        }
        res.redirect('/');
    });
});

// Set up server port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});