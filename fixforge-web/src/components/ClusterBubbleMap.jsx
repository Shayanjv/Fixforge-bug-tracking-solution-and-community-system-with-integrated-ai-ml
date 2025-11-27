import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Bubble map component that uses clusters passed as props
 * Props:
 *  - clusters: array of cluster objects from parent
 *  - onBubbleClick: optional callback when bubble is clicked
 */
export default function ClusterBubbleMap({ clusters = [], onBubbleClick }) {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const nodesRef = useRef([]);

  // deterministic pseudo-random generator for seeding positions
  const seeded = (seed) => {
    let x = seed >>> 0;
    return () => {
      x = (x * 1664525 + 1013904223) >>> 0;
      return (x & 0xfffffff) / 0xfffffff;
    };
  };

  // map cluster size to radius in viewBox units (0..100)
  const sizeToRadius = (size, maxSize) => {
    const base = Math.sqrt(Math.max(1, size));
    const scale = 3.6;
    const r = Math.max(3, Math.min(18, (base / Math.sqrt(maxSize || 1)) * 18 * 0.9 + 3));
    return r * (scale / 3.6);
  };

  // relaxation step
  function relaxStep(nodesArr, padding = 1.5, centerPull = 0.02) {
    let moved = false;
    const n = nodesArr.length;
    for (let i = 0; i < n; i++) {
      const a = nodesArr[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodesArr[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const minDist = a.r + b.r + padding;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          a.x = Math.max(a.r, Math.min(100 - a.r, a.x));
          a.y = Math.max(a.r, Math.min(100 - a.r, a.y));
          b.x = Math.max(b.r, Math.min(100 - b.r, b.x));
          b.y = Math.max(b.r, Math.min(100 - b.r, b.y));
          moved = true;
        }
      }
      a.x += (50 - a.x) * centerPull;
      a.y += (50 - a.y) * centerPull;
      a.x = Math.max(a.r, Math.min(100 - a.r, a.x));
      a.y = Math.max(a.r, Math.min(100 - a.r, a.y));
    }
    return moved;
  }

  // ✅ FIXED: Use clusters prop instead of fetching
  useEffect(() => {
    if (!clusters || clusters.length === 0) {
      setNodes([]);
      return;
    }

    let mounted = true;
    setLoading(true);

    // ✅ Process the clusters prop directly
    const maxSize = Math.max(...clusters.map(c => Number(c.size) || 1));
    const prepared = clusters.map((c, idx) => {
      const id = c.id ?? idx;
      const seed = typeof id === "string" ? id.charCodeAt(0) + idx : (typeof id === "number" ? id : idx + 1);
      const rnd = seeded(seed);
      const r = sizeToRadius(Number(c.size) || 1, maxSize);
      const x = typeof c.x === "number" ? Math.max(r, Math.min(100 - r, c.x)) : 10 + rnd() * 80;
      const y = typeof c.y === "number" ? Math.max(r, Math.min(100 - r, c.y)) : 10 + rnd() * 80;
      
      return {
        id,
        cluster_id: c.id ?? c.cluster_id ?? id,
        label: (c.label || c.title || c.top_terms || `Cluster ${idx + 1}`).toString(),
        size: Number(c.size) || 1,
        color: c.color || "#8B5CF6",
        x,
        y,
        r,
      };
    });

    nodesRef.current = prepared;
    setNodes(prepared);

    // Animate relaxation
    let iter = 0;
    const maxIter = 400;
    const perFrame = 4;

    function frame() {
      if (!mounted) return;
      let moved = false;
      for (let k = 0; k < perFrame && iter < maxIter; k++, iter++) {
        moved = relaxStep(nodesRef.current) || moved;
      }
      setNodes(nodesRef.current.map(n => ({ ...n })));
      if (iter < maxIter && moved) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setLoading(false);
      }
    }
    
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clusters]); // ✅ Re-run when clusters prop changes

  // Tooltip handlers
  const handleEnter = (n, e) => {
    setHoveredId(n.id);
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      html: `${n.label} • ${n.size} item${n.size === 1 ? "" : "s"}`,
    });
  };

  const handleMove = (e) => {
    if (!tooltip) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip(t => ({ ...t, x: e.clientX - rect.left, y: e.clientY - rect.top }));
  };

  const handleLeave = () => {
    setHoveredId(null);
    setTooltip(null);
  };

  const handleClick = (n) => {
    console.log("Cluster clicked:", n);
    if (onBubbleClick) {
      onBubbleClick(n);
    }
  };

  if (!clusters || clusters.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-lg border border-dashed border-gray-200">
        <p className="text-sm text-gray-500">No clusters available</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-lg border border-dashed border-gray-200">
        <p className="text-sm text-gray-500">Loading clusters…</p>
      </div>
    );
  }

  const sorted = [...nodes].sort((a, b) => (a.id === hoveredId ? 1 : b.id === hoveredId ? -1 : 0));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-96 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg overflow-hidden"
      onMouseMove={handleMove}
    >
      <svg 
        className="w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid meet" 
        role="img" 
        aria-label="Clusters bubble map"
      >
        <defs>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feBlend in="SourceGraphic" in2="b" mode="normal" />
          </filter>
        </defs>

        {sorted.map((n) => (
          <g 
            key={n.id} 
            transform={`translate(${n.x}, ${n.y})`} 
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={0}
              cy={0}
              r={n.r}
              fill={n.color}
              opacity={hoveredId === n.id ? 0.98 : 0.78}
              stroke="#fff"
              strokeWidth={hoveredId === n.id ? 0.6 : 0.35}
              onMouseEnter={(e) => handleEnter(n, e)}
              onMouseLeave={handleLeave}
              onClick={() => handleClick(n)}
              style={{ transition: "r 160ms, opacity 160ms" }}
              filter="url(#soft)"
            />
            {n.r > 5 && (
              <text
                x={n.r + 1.5}
                y={3}
                fontSize="3.2"
                fill="#111827"
                style={{ 
                  pointerEvents: "none", 
                  fontFamily: "Inter, system-ui, sans-serif", 
                  userSelect: "none" 
                }}
              >
                {String(n.label).length > 20 ? `${String(n.label).slice(0, 18)}…` : n.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-white/95 backdrop-blur-sm border border-gray-100 rounded-md px-3 py-2 text-xs shadow-md"
          style={{
            left: Math.min(tooltip.x + 12, containerRef.current?.clientWidth - 180 || 0),
            top: Math.max(tooltip.y + 12, 8),
            width: 180,
          }}
        >
          {tooltip.html}
        </div>
      )}
    </div>
  );
}
