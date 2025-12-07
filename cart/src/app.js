const cookieParser = require('cookie-parser');
const express = require('express');
const cartRoutes = require('./routes/cart.routes');

const app = express();
app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res)=>{
  return res.status(200).json({
    message: 'Cart service is running'
  });
});
app.use('/api/cart', cartRoutes);

module.exports = app;