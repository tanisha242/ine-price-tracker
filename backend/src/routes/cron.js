import express from "express";
import { scrapeAllActiveProducts } from "../services/scrapeService.js";

const router = express.Router();

/**
 * Endpoint for scheduled cron job (cron-job.org / Render Cron)
 * Supports both GET and POST
 */
const handleCronTrigger = async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization || req.query.secret;

    // Optional secret check if set
    if (cronSecret && cronSecret !== "change-this-to-a-long-random-secret") {
      if (authHeader !== `Bearer ${cronSecret}` && authHeader !== cronSecret) {
        return res.status(401).json({ error: "Unauthorized cron trigger" });
      }
    }

    console.log("[Cron] Triggering scheduled scrape for all active products...");
    const report = await scrapeAllActiveProducts();
    console.log("[Cron] Scheduled scrape finished:", report);

    res.json({
      status: "success",
      message: "Scheduled scrape run completed",
      report
    });
  } catch (err) {
    console.error("[Cron] Error running scheduled scrape:", err);
    res.status(500).json({ error: "Cron scrape execution failed", message: err.message });
  }
};

router.get("/scrape-all", handleCronTrigger);
router.post("/scrape-all", handleCronTrigger);

export default router;
