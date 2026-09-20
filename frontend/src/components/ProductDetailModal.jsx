import React, { useState, useEffect } from "react";
import { X, RefreshCw, ExternalLink, Calendar, AlertCircle, CheckCircle, RotateCw } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function ProductDetailModal({ API_BASE_URL, trackedProductId, onClose, onManualScrape }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tracked-products/${trackedProductId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Fetch detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [trackedProductId, API_BASE_URL]);

  const handleScrapeNow = async () => {
    setIsScraping(true);
    await onManualScrape(trackedProductId);
    await fetchDetail();
    setIsScraping(false);
  };

  if (!trackedProductId) return null;

  const product = data?.product || {};
  const priceHistory = (data?.priceHistory || []).map(h => ({
    time: new Date(h.scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: new Date(h.scraped_at).toLocaleString(),
    price: parseFloat(h.price),
    stock: h.stock_quantity ?? (h.stock_status === "IN_STOCK" ? 1 : 0)
  }));

  const scrapeLogs = data?.scrapeLogs || [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000,
        backgroundColor: "rgba(36, 35, 38, 0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <div
        className="rose-card"
        style={{
          width: "min(90vw, 1380px)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
          position: "relative",
          backgroundColor: "#FFFFFF"
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: "24px",
            top: "24px",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer"
          }}
        >
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Loading product details and audit history...
          </div>
        ) : (
          <div>
            {/* Header info */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span className="badge badge-retried" style={{ fontSize: "0.65rem" }}>
                  {product.category || "General"}
                </span>
                <span className="font-mono" style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>
                  SKU: {product.sku}
                </span>
              </div>
              <h2 className="font-serif" style={{ fontSize: "1.8rem", fontWeight: "600", color: "var(--text-charcoal)" }}>
                {product.name}
              </h2>
              <div style={{ display: "flex", gap: "16px", marginTop: "6px", fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                <span>Brand: <strong style={{ color: "var(--text-charcoal)" }}>{product.brand || "INE Store"}</strong></span>
                <a
                  href={product.product_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--rose-deep)", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none", fontWeight: "500" }}
                >
                  View Live Store Page <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Quick Actions & Scrape Audit Counter */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--bg-page)",
                padding: "16px 20px",
                borderRadius: "8px",
                marginBottom: "28px",
                border: "1px solid var(--border-color)",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>
                  Scrape Audit Attempts Logged
                </span>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-charcoal)", marginTop: "2px" }}>
                  {scrapeLogs.length} attempts recorded
                </div>
              </div>
              <button onClick={handleScrapeNow} disabled={isScraping} className="btn btn-rose" style={{ fontSize: "0.8rem" }}>
                <RefreshCw size={13} className={isScraping ? "spin-animation" : ""} />
                {isScraping ? "Scraping Live..." : "Scrape Price Now"}
              </button>
            </div>

            {/* 1. Price History Chart */}
            <div style={{ marginBottom: "36px" }}>
              <h3 className="font-serif" style={{ fontSize: "1.35rem", fontWeight: "600", marginBottom: "14px", color: "var(--text-charcoal)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={18} color="var(--rose-primary)" /> Price History
              </h3>

              {priceHistory.length === 0 ? (
                <div style={{ backgroundColor: "var(--bg-page)", borderRadius: "8px", padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", border: "1px solid var(--border-color)" }}>
                  No price observations recorded yet. Click "Scrape Price Now" to record initial datapoint.
                </div>
              ) : (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "8px", padding: "20px 16px 12px 0", border: "1px solid var(--border-color)", height: "260px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6E3E1" />
                      <XAxis dataKey="time" stroke="#8C8988" fontSize={11} />
                      <YAxis stroke="#8C8988" fontSize={11} domain={['auto', 'auto']} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E6E3E1", borderRadius: "8px", color: "#242326", boxShadow: "0 4px 12px rgba(36,35,38,0.06)" }}
                        formatter={(value) => [`₹${value}`, "Selling Price"]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                      />
                      <Line type="monotone" dataKey="price" stroke="#B98F91" strokeWidth={2.5} dot={{ r: 4, fill: "#8F6265" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 2. Honest Scrape Log Table */}
            <div>
              <h3 className="font-serif" style={{ fontSize: "1.35rem", fontWeight: "600", marginBottom: "14px", color: "var(--text-charcoal)" }}>
                Scrape History & Outcomes
              </h3>

              {scrapeLogs.length === 0 ? (
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No log entries recorded yet.</div>
              ) : (
                <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                  <table className="rose-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Attempt</th>
                        <th>Extracted Price</th>
                        <th>Extracted Stock</th>
                        <th>Duration</th>
                        <th>Error Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scrapeLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="font-mono" style={{ color: "var(--text-secondary)" }}>
                            {new Date(log.started_at).toLocaleString()}
                          </td>
                          <td>
                            {log.status === "SUCCESS" && <span className="badge badge-success"><CheckCircle size={10} /> SUCCESS</span>}
                            {log.status === "RETRIED" && <span className="badge badge-retried"><RotateCw size={10} /> RETRIED</span>}
                            {log.status === "FAILED" && <span className="badge badge-failed"><AlertCircle size={10} /> FAILED</span>}
                          </td>
                          <td className="font-mono" style={{ textAlign: "center" }}>
                            {log.attempt}
                          </td>
                          <td style={{ fontWeight: "600", color: log.extracted_price ? "var(--text-charcoal)" : "var(--text-secondary)" }}>
                            {log.extracted_price ? `₹${log.extracted_price}` : "—"}
                          </td>
                          <td>
                            {log.extracted_stock ? `${log.extracted_stock} (${log.extracted_stock_quantity ?? 'N/A'})` : "—"}
                          </td>
                          <td className="font-mono" style={{ color: "var(--text-secondary)" }}>
                            {log.duration_ms ? `${log.duration_ms}ms` : "—"}
                          </td>
                          <td style={{ color: "var(--status-failed-text)", fontSize: "0.775rem" }}>
                            {log.error_message || "None"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
