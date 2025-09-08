// firebaseService.js
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

/**
 * Save SEO Report to Firestore under user's document
 * @param {Firestore} db - Firestore database instance
 * @param {string} appId - The application ID from the Canvas environment
 * @param {string} uid - Firebase user ID
 * @param {string} url - Website URL analyzed
 * @param {Object} reportData - The full report object from backend
 */
export const saveReportToFirestore = async (db, appId, uid, url, reportData) => {
  try {
    // Use the path structure consistent with dashboard.jsx for Canvas environment
    const userReportsRef = collection(db, `artifacts/${appId}/users/${uid}/reports`);
    await addDoc(userReportsRef, {
      url,
      reportData, // Store the full processed report data
      timestamp: new Date() // Add a server timestamp for ordering
    });
    console.log("✅ Report saved to Firestore");
  } catch (error) {
    console.error("❌ Error saving report:", error);
  }
};

/**
 * Fetch all saved reports of a user
 * @param {Firestore} db - Firestore database instance
 * @param {string} appId - The application ID from the Canvas environment
 * @param {string} uid - Firebase user ID
 * @returns {Array} List of reports
 */
export const fetchUserReports = async (db, appId, uid) => {
  try {
    const userReportsRef = collection(db, `artifacts/${appId}/users/${uid}/reports`);
    // Order by timestamp in descending order to show most recent first
    const q = query(userReportsRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return reports;
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    return [];
  }
};

/**
 * Delete a specific report from a user's history
 * @param {Firestore} db - Firestore database instance
 * @param {string} appId - The application ID from the Canvas environment
 * @param {string} uid - Firebase user ID
 * @param {string} reportId - The ID of the report document to delete
 */
export const deleteReportFromFirestore = async (db, appId, uid, reportId) => {
  try {
    // Construct the document reference using the consistent path
    const reportDocRef = doc(db, `artifacts/${appId}/users/${uid}/reports`, reportId);
    await deleteDoc(reportDocRef);
    console.log("✅ Report deleted from Firestore");
  } catch (error) {
    console.error("❌ Error deleting report:", error);
    throw error; // Re-throw to allow calling component to handle
  }
};
