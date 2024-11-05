const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
const axios = require('axios');
const User = require("./models/user");
const path = require("path");
const Userroute = require('./routes/user');
const cookieParser = require("cookie-parser");
const { checkforAuthenticationcookie } = require('./middlewares/authentication');
const mongoose = require("mongoose");
const cron = require('node-cron');  // Import node-cron
require("dotenv").config();

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({ extended: false }));

// Initialize Express
const PORT = process.env.PORT || 8000;

// Mongoose Connection
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.log("Error connecting to MongoDB:", error));

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
        user:"harsharunmishran@gmail.com", // From environment variables
        pass: process.env.password    // From environment variables
    }
});

// Function to fetch a random motivational quote from ZenQuotes API
async function fetchMotivationalQuote() {
    try {
        const response = await axios.get('https://zenquotes.io/api/random');
        const quote = response.data[0]; // Get the first quote
        return `${quote.q} - ${quote.a}`; // Return the quote and author
    } catch (error) {
        console.error('Error fetching quote:', error);
        return 'Stay motivated!'; // Fallback message if API fails
    }
}

// Function to send email and save the quote in user's message array
async function sendEmailWithQuote(user) {
    try {
        const quote = await fetchMotivationalQuote(); // Fetch the quote

        const mailOptions = {
            from:"harsharunmishran@gmail.com", // From environment variables
            to: user.email,
            subject: 'Your Daily Motivational Quote',
            text: quote // Add the fetched quote to the email content
        };

        // Send the email
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.log(`Error sending email to ${user.email}:`, error);
            } else {
                console.log(`Email sent to ${user.email}: ` + info.response);

                await User.updateOne(
                    { _id: user._id }, // Find the user by their ID
                    { $push: { messages: quote } } // Push the quote to the messages array
                );
                console.log(`Quote added to ${user.email}'s message array.`);
            }
        });
    } catch (error) {
        console.error('Error while sending email or updating message:', error);
    }
}

// Function to send emails to all users in the database
async function sendQuotesToAllUsers() {
    try {
        const users = await User.find({}); // Fetch all users from the database

        // Loop through all users and send them a motivational quote
        for (const user of users) {
            await sendEmailWithQuote(user); // Send email to each user and update their message array
        }
        console.log("Motivational quotes sent to all users.");
    } catch (error) {
        console.error("Error fetching users or sending emails:", error);
    }
}

// Schedule the job to run every 3 minutes using cron
cron.schedule('0 9 * * *', () => {
    console.log('Running cron job to send motivational quotes to all users...');
    sendQuotesToAllUsers(); // Call the function to send quotes
}, {
    timezone: "Asia/Kolkata"  // Set the appropriate timezone
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(checkforAuthenticationcookie("token"));

// Render the view for mails
app.get('/', (req, res) => {
    if(!req.user){
        res.redirect("/user/signin");
    }
        res.render("allmails", {
            user: req.user,
        });
});

// User routes
app.use('/user', Userroute);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
