const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
// CORS configuration with your actual Netlify URL
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'https://freesip-test.netlify.app', // Your actual Netlify URL
        'https://my-backend-5zho.onrender.com', // Your Render backend URL
        process.env.FRONTEND_URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Contact form specific rate limiting
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 contact form submissions per hour
    message: {
        success: false,
        message: 'Too many contact form submissions. Please try again later.'
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Contact Schema
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    company: {
        type: String,
        trim: true,
        maxlength: 100,
        default: ''
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: String,
    userAgent: String
});

// Add indexes for better query performance
contactSchema.index({ email: 1, submittedAt: -1 });
contactSchema.index({ submittedAt: -1 });

const Contact = mongoose.model('Contact', contactSchema);

// Validation middleware
const validateContactForm = (req, res, next) => {
    const { name, email, message } = req.body;
    
    // Check required fields
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and message are required fields.'
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address.'
        });
    }
    
    // Check field lengths
    if (name.trim().length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Name must be less than 100 characters.'
        });
    }
    
    if (message.trim().length > 1000) {
        return res.status(400).json({
            success: false,
            message: 'Message must be less than 1000 characters.'
        });
    }
    
    if (req.body.company && req.body.company.trim().length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Company name must be less than 100 characters.'
        });
    }
    
    next();
};

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Contact Form API Server',
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Contact form submission endpoint
app.post('/api/contact/submit', contactLimiter, validateContactForm, async (req, res) => {
    try {
        const { name, email, company, message } = req.body;
        
        // Check for duplicate submissions (same email within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentSubmission = await Contact.findOne({
            email: email.toLowerCase(),
            submittedAt: { $gte: fiveMinutesAgo }
        });
        
        if (recentSubmission) {
            return res.status(429).json({
                success: false,
                message: 'You have already submitted a message recently. Please wait before submitting again.'
            });
        }
        
        // Create new contact entry
        const contactData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            company: company ? company.trim() : '',
            message: message.trim(),
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        };
        
        const contact = new Contact(contactData);
        await contact.save();
        
        console.log('New contact form submission:', {
            name: contactData.name,
            email: contactData.email,
            timestamp: new Date().toISOString()
        });
        
        res.status(200).json({
            success: true,
            message: 'Thank you for your message! We\'ll get back to you soon.',
            submissionId: contact._id
        });
        
    } catch (error) {
        console.error('Contact form submission error:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid form data. Please check your inputs and try again.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.'
        });
    }
});

// Get all contacts (for admin use - you might want to add authentication)
app.get('/api/contacts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const contacts = await Contact.find()
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-ipAddress -userAgent'); // Hide sensitive data
        
        const total = await Contact.countDocuments();
        
        res.json({
            success: true,
            data: contacts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalContacts: total,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contacts'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});