const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const materialRoutes = require('./routes/materials');
const recipeRoutes = require('./routes/recipes');
const categoryRoutes = require('./routes/categories');

dotenv.config();
const app = express();

app.use(helmet());

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Growish API Catalog is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Growish API Catalog is running on port ${PORT}`);
});