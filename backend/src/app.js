import express from "express";
import cors from "cors";
import { supabase } from "./config/supabase.js";
import productsRouter from "./routes/products.js";
import trackedProductsRouter from "./routes/trackedProducts.js";
import cronRouter from "./routes/cron.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// Supabase connection test
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .limit(5);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      count: data.length,
      products: data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API Routes
app.use("/api/products", productsRouter);
app.use("/api/tracked-products", trackedProductsRouter);
app.use("/api/cron", cronRouter);

export default app;