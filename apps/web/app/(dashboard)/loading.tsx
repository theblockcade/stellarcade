import React from "react";

export default function DashboardLoading() {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
      data-testid="dashboard-loading-skeleton"
    >
      {/* Top Banner Shimmer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              width: "180px",
              height: "28px",
              borderRadius: "8px",
              background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(0,255,204,0.08) 50%, rgba(255,255,255,0.04) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.8s infinite linear",
            }}
          />
          <div
            style={{
              width: "320px",
              height: "16px",
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.04)",
            }}
          />
        </div>

        <div
          style={{
            width: "140px",
            height: "38px",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.05)",
          }}
        />
      </div>

      {/* KPI Cards Grid Shimmer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div
                style={{
                  width: "90px",
                  height: "18px",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.08)",
                }}
              />
              <div
                style={{
                  width: "40px",
                  height: "14px",
                  borderRadius: "4px",
                  background: "rgba(0, 255, 204, 0.1)",
                }}
              />
            </div>
            <div
              style={{
                width: "140px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.06)",
              }}
            />
            <div
              style={{
                width: "100%",
                height: "12px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.04)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Main Content Area Shimmer */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          minHeight: "320px",
        }}
      >
        <div
          style={{
            width: "220px",
            height: "22px",
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.06)",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "50px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "50px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "50px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
