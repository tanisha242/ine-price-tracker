import React, { useState, useEffect } from "react";
import { Search, Plus, Check, Loader2 } from "lucide-react";

export function ProductSearch({ API_BASE_URL, trackedProductIds, onTrackProduct }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // Search catalog with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(query)}&pageSize=12`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.items || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, API_BASE_URL]);

  const handleTrack = async (product) => {
    setAddingId(product.id);
    await onTrackProduct(product);
    setAddingId(null);
  };

  return (
    <section className="rose-card" style={{ marginTop: "24px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 className="font-serif" style={{ fontSize: "1.4rem", fontWeight: "600", color: "var(--text-charcoal)" }}>
            Search Store Catalog
          </h2>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Search INE mock store products by full name, partial query, or SKU
          </p>
        </div>

        <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            className="rose-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search e.g. 'Vantablack', 'Keyboard'..."
            style={{ width: "100%" }}
          />
          {loading && (
            <Loader2 size={16} className="spin-animation" style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--rose-primary)" }} />
          )}
        </div>
      </div>

      {/* Catalog Search Results Grid */}
      {results.length === 0 && !loading ? (
        <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          No catalog products matching "{query}"
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px", maxHeight: "340px", overflowY: "auto", paddingRight: "4px" }}>
          {results.map((prod) => {
            const isTracked = trackedProductIds.includes(prod.id);
            const isAdding = addingId === prod.id;

            return (
              <div
                key={prod.id}
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <span className="badge badge-retried" style={{ fontSize: "0.65rem" }}>
                      {prod.category || "General"}
                    </span>
                    <span className="font-mono" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      {prod.sku}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "0.925rem", fontWeight: "600", marginBottom: "4px", color: "var(--text-charcoal)", lineHeight: 1.3 }}>
                    {prod.name}
                  </h3>
                  <p style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                    {prod.brand ? `Brand: ${prod.brand}` : "INE Store"}
                  </p>
                </div>

                <button
                  onClick={() => handleTrack(prod)}
                  disabled={isTracked || isAdding}
                  className={isTracked ? "btn btn-tracked" : "btn btn-rose"}
                  style={{ width: "100%", fontSize: "0.8rem", padding: "8px 12px" }}
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={14} className="spin-animation" /> Adding...
                    </>
                  ) : isTracked ? (
                    <>
                      <Check size={14} color="var(--rose-deep)" /> Already Tracked
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Track Product
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
