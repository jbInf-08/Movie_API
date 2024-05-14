const jwt = require('jsonwebtoken');
const Users = require('./models').User;

const jwtSecret = 'your_jwt_secret';

const generateJWTToken = (user) => {
  return jwt.sign({ userId: user._id }, jwtSecret, {
    expiresIn: '1h',
  });
};

const authenticateUser = async (req, res) => {
  const { Username, Password } = req.body;

  try {

    const user = await Users.findOne({ Username: Username });
    console.log(`User: ${user}`);
    
    console.log(user.validatePassword(Password))
    if (!user || !user.validatePassword(Password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateJWTToken(user);
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  authenticateUser,
};