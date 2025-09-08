import admin from 'firebase-admin';
import logger from '../src/logger.js';

export const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ error: 'Unauthorized: No token provided.' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach user payload to the request
        next();
    } catch (error) {
        logger.error('Firebase token verification failed:', error);
        res.status(403).send({ error: 'Forbidden: Invalid token.' });
    }
};