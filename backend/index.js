require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Importación de Rutas ---
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);

// ----------------------------

const PORT = process.env.PORT || 3000;
const MONGO_URI = "mongodb://uttreyes_db_user:5R9iY48aOLxBF38T@ac-kqfvmz8-shard-00-00.tmy7men.mongodb.net:27017,ac-kqfvmz8-shard-00-01.tmy7men.mongodb.net:27017,ac-kqfvmz8-shard-00-02.tmy7men.mongodb.net:27017/puntovent_db?ssl=true&replicaSet=atlas-z3jt19-shard-0&authSource=admin";

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4
})
  .then(() => {
    console.log('🔥 Conectado exitosamente a MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error conectando a MongoDB:', error.message);
  });