import React from "react";
import { RefreshCw, ExternalLink, TrendingUp } from "lucide-react";

export function Navbar({ onScrapeAll, isScrapingAll }) {
  return (
    <header
      className="rose-card"
      style={{
        margin: "24px 24px 0 24px",
        padding: "18px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "var(--rose-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--rose-deep)"
          }}
        >
          <TrendingUp size={20} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              className="font-serif"
              style={{
                fontSize: "1.65rem",
                fontWeight: "700",
                color: "var(--text-charcoal)",
                letterSpacing: "-0.01em",
                lineHeight: 1
              }}
            >
              price /
            </span>
            <span className="badge badge-success" style={{ fontSize: "0.625rem", padding: "2px 6px" }}>
              Engine Ready
            </span>
          </div>
          <div
            style={{
              fontSize: "0.65rem",
              fontWeight: "600",
              color: "var(--text-secondary)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: "4px"
            }}
          >
            INE STORE · PRICE TRACKER
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <a
          href="https://demo.inelabteamdev.com"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline"
          style={{ fontSize: "0.8rem", padding: "8px 14px" }}
        >
          Visit Store <ExternalLink size={13} />
        </a>

        <button
          onClick={onScrapeAll}
          disabled={isScrapingAll}
          className="btn btn-rose"
          style={{ fontSize: "0.8rem", padding: "8px 16px" }}
        >
          <RefreshCw size={13} className={isScrapingAll ? "spin-animation" : ""} />
          {isScrapingAll ? "Scraping All Active..." : "Run Batch Scrape"}
        </button>
      </div>
    </header>
  );
}
