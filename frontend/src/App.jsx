import { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { ProductSearch } from "./components/ProductSearch";
import { TrackedProductsList } from "./components/TrackedProductsList";
import { ProductDetailModal } from "./components/ProductDetailModal";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function App() {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapingIds, setScrapingIds] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch tracked products from backend API
  const fetchTrackedProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tracked-products`);
      if (res.ok) {
        const data = await res.json();
        setTrackedProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch tracked products:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tracked-products`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setTrackedProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch tracked products:", err);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Track product
  const handleTrackProduct = async (product) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tracked-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id })
      });

      if (res.ok) {
        showToast(`Now tracking "${product.name}". Initial Playwright scrape initiated!`);
        await fetchTrackedProducts();
      } else {
        showToast(`Failed to track product: ${res.statusText}`);
      }
    } catch (err) {
      showToast(`Error tracking product: ${err.message}`);
    }
  };

  // Single manual scrape
  const handleScrapeSingle = async (trackedId) => {
    setScrapingIds((prev) => [...prev, trackedId]);
    showToast("Playwright scraper executing against target store...");
    try {
      const res = await fetch(`${API_BASE_URL}/api/tracked-products/${trackedId}/scrape`, {
        method: "POST"
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(`Scrape SUCCESS! Updated price: ₹${data.price}`);
        } else {
          showToast(`Scrape FAILED: ${data.error}`);
        }
      }
    } catch (err) {
      showToast(`Scrape error: ${err.message}`);
    } finally {
      setScrapingIds((prev) => prev.filter((id) => id !== trackedId));
      await fetchTrackedProducts();
    }
  };

  // Scrape all active products
  const handleScrapeAll = async () => {
    setIsScrapingAll(true);
    showToast("Executing scheduled scrape run for all active products...");
    try {
      const res = await fetch(`${API_BASE_URL}/api/cron/scrape-all`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const report = data.report || {};
        showToast(`Batch Scrape Finished! Successful: ${report.successCount}/${report.totalTracked}`);
      }
    } catch (err) {
      showToast(`Batch scrape failed: ${err.message}`);
    } finally {
      setIsScrapingAll(false);
      await fetchTrackedProducts();
    }
  };

  // Delete/untrack product
  const handleDeleteTracked = async (trackedId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tracked-products/${trackedId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        showToast("Product untracked successfully");
        await fetchTrackedProducts();
      }
    } catch (err) {
      showToast(`Delete error: ${err.message}`);
    }
  };

  const trackedProductIds = trackedProducts.map((p) => p.product?.id).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "60px" }}>
      <Navbar onScrapeAll={handleScrapeAll} isScrapingAll={isScrapingAll} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 300,
            backgroundColor: "var(--text-charcoal)",
            color: "#FFFFFF",
            padding: "12px 22px",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(36, 35, 38, 0.15)",
            fontSize: "0.85rem",
            fontWeight: "500",
            fontFamily: "var(--font-sans)"
          }}
        >
          {toastMessage}
        </div>
      )}

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
        {/* Editorial Hero Section */}
        <section style={{ marginTop: "42px", marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: "600",
              color: "var(--rose-deep)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "6px"
            }}
          >
            TRACK YOUR PRODUCTS
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(2.3rem, 4.5vw, 3.4rem)",
              fontWeight: "600",
              color: "var(--text-charcoal)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15
            }}
          >
            Track what matters. <br />
            <span style={{ fontStyle: "italic", fontWeight: "400", color: "var(--rose-deep)" }}>
              Know what it costs.
            </span>
          </h1>
        </section>

        <ProductSearch
          API_BASE_URL={API_BASE_URL}
          trackedProductIds={trackedProductIds}
          onTrackProduct={handleTrackProduct}
        />

        <TrackedProductsList
          trackedProducts={trackedProducts}
          onScrapeSingle={handleScrapeSingle}
          onSelectProduct={(item) => setSelectedProductId(item.id)}
          onDeleteTracked={handleDeleteTracked}
          scrapingIds={scrapingIds}
        />
      </main>

      {/* Modal for Product History & Honest Audit Logs */}
      {selectedProductId && (
        <ProductDetailModal
          API_BASE_URL={API_BASE_URL}
          trackedProductId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onManualScrape={handleScrapeSingle}
        />
      )}
    </div>
  );
}

export default App;
