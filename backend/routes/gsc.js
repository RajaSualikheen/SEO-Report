import express from "express";
import { google } from "googleapis";
import admin from "firebase-admin";
import logger from "../src/logger.js";
import { verifyFirebaseToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const db = admin.firestore();
// Helper function to format dates as YYYY-MM-DD
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
// GET /api/gsc/sites - Fetches all sites for the authenticated user
router.get("/sites", verifyFirebaseToken, async (req, res) => {
    // The user's UID is attached to req.user by the verifyFirebaseToken middleware
    const googleUserId = req.user.uid; 
    
    logger.info(`Fetching GSC sites for user: ${googleUserId}`);

    try {
        // 1. Retrieve the user's refresh token from Firestore
        const userDocRef = db.collection("users").doc(googleUserId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found in Firestore." });
        }

        const userData = userDoc.data();
        const gscRefreshToken = userData.gscRefreshToken;

        if (!gscRefreshToken) {
            return res.status(400).json({ error: "GSC refresh token not found for this user." });
        }
        
        // 2. Create a new OAuth2 client and set the refresh token
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            refresh_token: gscRefreshToken,
        });

        // 3. Initialize the GSC (Search Console) API client
        const searchconsole = google.searchconsole({
            version: 'v1',
            auth: oauth2Client,
        });

        // 4. Call the GSC API to get the list of sites
        const { data } = await searchconsole.sites.list();

        logger.info(`Successfully fetched ${data.siteEntry?.length || 0} sites for user ${googleUserId}`);

        // 5. Return the list of sites to the frontend
        res.status(200).json(data.siteEntry || []);

    } catch (error) {
        logger.error(`Error fetching GSC sites for user ${googleUserId}:`, error.message);
        if (error.response && error.response.data) {
             logger.error("Google API Error Details:", error.response.data);
        }
        res.status(500).json({ error: "Failed to fetch sites from Google Search Console." });
    }
});
router.post("/performance", verifyFirebaseToken, async (req, res) => {
    const googleUserId = req.user.uid;
    const { siteUrl } = req.body;

    if (!siteUrl) {
        return res.status(400).json({ error: "siteUrl is required in the request body." });
    }

    logger.info(`Fetching GSC performance for ${siteUrl} (user: ${googleUserId})`);

    try {
        const userDocRef = db.collection("users").doc(googleUserId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists || !userDoc.data().gscRefreshToken) {
            return res.status(400).json({ error: "GSC refresh token not found for this user." });
        }
        
        const gscRefreshToken = userDoc.data().gscRefreshToken;

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: gscRefreshToken });

         const webmasters = google.webmasters({
            version: 'v3', // v3 is the corresponding version for webmasters
            auth: oauth2Client,
        });

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 90);

        const { data } = await webmasters.searchanalytics.query({
            siteUrl: siteUrl,
            requestBody: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                dimensions: ['query'],
                // REMOVED: The invalid dimensionFilterGroups
                rowLimit: 250, // Get a larger set of data to filter ourselves
                searchType: 'web',
            }
        });

        const strikingDistanceKeywords = (data.rows || [])
            .filter(row => row.position > 10) // Keep only rows where position is on page 2+
            .sort((a, b) => b.impressions - a.impressions) // Sort by most impressions
            .slice(0, 25); // Return the top 25

        logger.info(`Found ${strikingDistanceKeywords.length} striking distance keywords for ${siteUrl}`);
        res.status(200).json(strikingDistanceKeywords);

    } catch (error) {
        let detailedError = error.message;
        if (error.response && error.response.data && error.response.data.error) {
            const googleError = error.response.data.error;
            detailedError = `Google API Error (${googleError.code}): ${googleError.message}`;
            logger.error("Google API Error Details:", googleError);
        } else {
            logger.error(`Full error object for ${siteUrl}:`, error);
        }
        logger.error(`Error fetching GSC performance for ${siteUrl}:`, detailedError);
        res.status(500).json({ error: detailedError });
    }
});
export default router;