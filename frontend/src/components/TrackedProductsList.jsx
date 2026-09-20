import React from "react";
import { RefreshCw, BarChart2, Trash2, Clock, AlertTriangle, CheckCircle2, RotateCw } from "lucide-react";

export function TrackedProductsList({ trackedProducts, onScrapeSingle, onSelectProduct, onDeleteTracked, scrapingIds }) {
  if (trackedProducts.length === 0) {
    return (
      <section className="rose-card" style={{ marginTop: "32px", padding: "54px 24px", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--rose-light)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: "var(--rose-deep)" }}>
          <BarChart2 size={24} />
        </div>
        <h3 className="font-serif" style={{ fontSize: "1.4rem", fontWeight: "600", color: "var(--text-charcoal)", marginBottom: "6px" }}>
          No Tracked Products Yet
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "440px", margin: "0 auto" }}>
          Search for products in the catalog above to start automated price & stock tracking.
        </p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: "38px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: "600",
            color: "var(--rose-deep)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: "4px"
          }}
        >
          TRACKING NOW
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 className="font-serif" style={{ fontSize: "1.7rem", fontWeight: "600", color: "var(--text-charcoal)" }}>
            Active Tracked Items <span style={{ fontSize: "1.1rem", fontWeight: "400", color: "var(--text-secondary)" }}>({trackedProducts.length})</span>
          </h2>
          <span style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>
            Auto-schedule: Every 2 Hours
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
        {trackedProducts.map((item) => {
          const product = item.product || {};
          const isScraping = scrapingIds.includes(item.id);
          const price = item.latestPrice;
          const status = item.lastScrapeStatus;

          return (
            <div
              key={item.id}
              className="rose-card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                {/* Header Badge Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <span className="badge badge-retried" style={{ fontSize: "0.65rem" }}>
                    {product.category || "General"}
                  </span>
                  
                  {status === "SUCCESS" && (
                    <span className="badge badge-success">
                      <CheckCircle2 size={11} /> Success
                    </span>
                  )}
                  {status === "RETRIED" && (
                    <span className="badge badge-retried">
                      <RotateCw size={11} /> Retried
                    </span>
                  )}
                  {status === "FAILED" && (
                    <span className="badge badge-failed">
                      <AlertTriangle size={11} /> Failed
                    </span>
                  )}
                  {!status && (
                    <span className="badge badge-neutral">Pending</span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "4px",
                    color: "var(--text-charcoal)",
                    cursor: "pointer",
                    lineHeight: 1.3
                  }}
                  onClick={() => onSelectProduct(item)}
                >
                  {product.name || "Product"}
                </h3>
                <p className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  SKU: {product.sku || "N/A"}
                </p>

                {/* Price and Stock Box */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "20px",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.675rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>
                      Current Price
                    </div>
                    <div className="font-sans" style={{ fontSize: "1.55rem", fontWeight: "700", color: price ? "var(--text-charcoal)" : "var(--text-secondary)", marginTop: "2px" }}>
                      {price !== null && price !== undefined ? `₹${price.toLocaleString()}` : "Pending"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.675rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>
                      Stock Status
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: item.latestStockStatus === "IN_STOCK" ? "var(--status-success-text)" : "var(--status-failed-text)", marginTop: "4px" }}>
                      {item.latestStockStatus === "IN_STOCK" 
                        ? (item.latestStockQuantity !== null ? `In Stock (${item.latestStockQuantity})` : "In Stock") 
                        : (item.latestStockStatus || "Unknown")}
                    </div>
                  </div>
                </div>

                {/* Last Scraped Timestamp */}
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
                  <Clock size={12} color="var(--text-secondary)" />
                  {item.lastScrapedAt 
                    ? `Last checked ${new Date(item.lastScrapedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` 
                    : "No scrape runs recorded yet"}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => onSelectProduct(item)}
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: "0.8rem", padding: "8px 12px" }}
                >
                  <BarChart2 size={13} /> History & Logs
                </button>

                <button
                  onClick={() => onScrapeSingle(item.id)}
                  disabled={isScraping}
                  className="btn btn-rose"
                  style={{ fontSize: "0.8rem", padding: "8px 14px" }}
                  title="Run Playwright Scraper Now"
                >
                  <RefreshCw size={13} className={isScraping ? "spin-animation" : ""} />
                  {isScraping ? "Scraping..." : "Scrape Now"}
                </button>

                <button
                  onClick={() => onDeleteTracked(item.id)}
                  className="btn btn-danger-outline"
                  style={{ padding: "8px 10px" }}
                  title="Untrack Product"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
