const express = require('express');
const cors = require('cors');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const financeRoutes = require('./routes/financeRoutes');
const patientRoutes = require('./routes/patientRoutes');
const supportRoutes = require('./routes/supportRoutes');
const shopRoutes = require('./routes/shopRoutes');
const salesRoutes = require('./routes/salesRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pharmacy API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
