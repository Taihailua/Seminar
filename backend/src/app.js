const express = require('express');
require('dotenv').config();
const accountRoutes = require('./routes/accountRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/qrcodes', require('express').static('qrcodes'));

app.use(express.json());

// Gắn route
app.use('/api/accounts', accountRoutes);
app.use('/api/auth', authRoutes);


const userRoutes = require('./routes/userRoutes');
app.use('/api/user', userRoutes);

const restaurantRoutes = require('./routes/restaurantRoutes');
app.use('/api/restaurant', restaurantRoutes);

const menuItemRoutes = require('./routes/menuItemRoutes');
app.use('/api/menu-item', menuItemRoutes);

const restaurantAudioRoutes = require('./routes/restaurantAudioRoutes');
app.use('/api/restaurant-audio', restaurantAudioRoutes);

const restaurantOwnerRoutes = require('./routes/restaurantOwnerRoutes');
app.use('/api/restaurant-owner', restaurantOwnerRoutes);

const restaurantMenuItemRoutes = require('./routes/restaurantMenuItemRoutes');
app.use('/api/restaurant-menu-item', restaurantMenuItemRoutes);

const restaurantAudioMapRoutes = require('./routes/restaurantAudioMapRoutes');
app.use('/api/restaurant-audio-map', restaurantAudioMapRoutes);

const scanHistoryRoutes = require('./routes/scanHistoryRoutes');
app.use('/api/scan-history', scanHistoryRoutes);
const PORT = process.env.PORT || 3000;
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});