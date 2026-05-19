const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/auth', require('./routes/authRoutes')); 

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB Cloud Database connected successfully!');
})
.catch((err) => {
    console.error('Database connection error:', err);
});

app.get('/', (req, res) => {
    res.send('LeadCRM Backend Server is running perfectly!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});

