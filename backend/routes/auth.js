import express from "express";
import { google } from "googleapis";
import logger from "../src/logger.js";
import admin from "firebase-admin";

const router = express.Router();
const db = admin.firestore();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Scopes: identity + GSC
const scopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/webmasters.readonly",
];

// Step 1: Redirect user to Google OAuth
router.get("/google", (req, res) => {
    const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent", // force refresh_token on every login
        scope: scopes,
    });
    console.log("[AUTH DEBUG] Generated Authorization URL:", authorizationUrl); // 💡 LOG
    res.redirect(authorizationUrl);
});

// Step 2: Callback after consent
router.get("/google/callback", async (req, res) => {
    console.log("\n[AUTH DEBUG] Reached /google/callback"); // 💡 LOG

    // 💡 LOG the entire query from Google. This is very important.
    console.log("[AUTH DEBUG] Received query parameters:", req.query);

    const { code, error: queryError } = req.query;

    if (queryError) {
        console.error("[AUTH DEBUG] Google returned an error in the query:", queryError); // 💡 LOG
        return res.redirect(`http://localhost:5173/dashboard?gsc_status=error&message=${queryError}`);
    }

    if (!code) {
        console.error("[AUTH DEBUG] Callback is missing the authorization code."); // 💡 LOG
        return res.status(400).send("Missing authorization code.");
    }

    console.log("[AUTH DEBUG] Authorization code received:", code); // 💡 LOG

    try {
        // Exchange code for tokens
        console.log("[AUTH DEBUG] Exchanging authorization code for tokens..."); // 💡 LOG
        const { tokens } = await oauth2Client.getToken(code);
        console.log("[AUTH DEBUG] Tokens received successfully:", tokens); // 💡 LOG
        
        const { id_token, refresh_token } = tokens;

        if (!id_token) {
            console.error("[AUTH DEBUG] No ID token was received from Google."); // 💡 LOG
            return res.status(400).send("No ID token received.");
        }

        // Decode identity from ID token
        const ticket = await oauth2Client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        console.log("[AUTH DEBUG] ID Token payload:", payload); // 💡 LOG

        const googleUserId = payload.sub;
        const email = payload.email;

        logger.info(`Google user authenticated: ${email} (${googleUserId})`);

        // Store refresh token in Firestore
        if (refresh_token) {
            const userDocRef = db.collection("users").doc(googleUserId);
            await userDocRef.set(
                {
                    email,
                    gscRefreshToken: refresh_token,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
            logger.info(`Stored GSC refresh token for ${googleUserId}`);
        } else {
            logger.warn(`No refresh_token returned for ${googleUserId}. This can happen on subsequent logins if the user has already granted consent.`);
        }

        // Create Firebase custom token
        const customToken = await admin.auth().createCustomToken(googleUserId);
        console.log("[AUTH DEBUG] Generated Firebase Custom Token."); // 💡 LOG

        // Redirect to frontend with firebase_token in query string
        res.redirect(
            `http://localhost:5173/dashboard?firebase_token=${customToken}`
        );

    } catch (error) {
        // 💡 This is the most critical log for the 400 error
        console.error("[AUTH DEBUG] FATAL OAuth callback error:", error.message);
        // Google API errors often have more details in the 'response' object
        if (error.response && error.response.data) {
            console.error("[AUTH DEBUG] Google API Error Details:", error.response.data);
        }
        logger.error("OAuth callback error:", error);
        res.redirect("http://localhost:5173/dashboard?gsc_status=error");
    }
});

export default router;