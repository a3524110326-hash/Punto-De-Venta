const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'puntovent_secreto_2026';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Ingresa usuario y contraseña.' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// Crea usuarios iniciales si no existe ninguno en MongoDB
exports.seedDefaultUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const cajeroPassword = await bcrypt.hash('cajero123', 10);

      await User.insertMany([
        { username: 'admin', password: adminPassword, role: 'admin' },
        { username: 'cajero1', password: cajeroPassword, role: 'cajero' }
      ]);
      console.log('Usuarios iniciales creados -> Admin: admin / admin123 | Cajero: cajero1 / cajero123');
    }
  } catch (error) {
    console.error('Error al crear usuarios iniciales:', error);
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Ingresa usuario y contraseña.' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Ese nombre de usuario ya existe.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: username.trim(),
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'cajero'
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente.',
      user: { id: newUser._id, username: newUser.username, role: newUser.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};