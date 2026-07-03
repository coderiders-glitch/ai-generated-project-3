const AWS = require('aws-sdk');

// AWS Cognito configuration
const cognitoConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_CLIENT_ID,
  identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID
};

// Initialize Cognito Identity Service Provider
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: cognitoConfig.region
});

// Initialize Cognito Identity
const cognitoIdentity = new AWS.CognitoIdentity({
  region: cognitoConfig.region
});

/**
 * Verify JWT token from Cognito
 * @param {string} token - JWT token to verify
 * @returns {Promise<object>} - Decoded token payload
 */
async function verifyToken(token) {
  try {
    const params = {
      AccessToken: token
    };
    
    const result = await cognitoIdentityServiceProvider.getUser(params).promise();
    return {
      valid: true,
      user: {
        username: result.Username,
        attributes: result.UserAttributes.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {})
      }
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Middleware to authenticate requests
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const verification = await verifyToken(token);
  
  if (!verification.valid) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = verification.user;
  next();
}

/**
 * Get Cognito configuration for client-side usage
 * @returns {object} - Public configuration object
 */
function getPublicConfig() {
  return {
    region: cognitoConfig.region,
    userPoolId: cognitoConfig.userPoolId,
    clientId: cognitoConfig.clientId,
    identityPoolId: cognitoConfig.identityPoolId
  };
}

module.exports = {
  cognitoConfig,
  verifyToken,
  authenticateToken,
  getPublicConfig,
  cognitoIdentityServiceProvider,
  cognitoIdentity
};