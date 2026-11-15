'use client';

import React, { useEffect, useRef } from 'react';

interface DayData {
  date: string;
  completed: number;
  failed: number;
}

interface WorkflowChartProps {
  data: DayData[];
  height?: number;
}

export function WorkflowChart({ data, height = 180 }: WorkflowChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive sizing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = height;
    const PAD = { top: 20, right: 16, bottom: 32, left: 40 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    // Colors from CSS vars — read from document
    const style = getComputedStyle(document.documentElement);
    const colorSuccess = style.getPropertyValue('--success').trim() || '#22c55e';
    const colorDanger  = style.getPropertyValue('--danger').trim()  || '#ef4444';
    const colorBorder  = style.getPropertyValue('--border').trim()  || '#2a2d3e';
    const colorMuted   = style.getPropertyValue('--text-muted').trim() || '#8892a4';
    const colorFaint   = style.getPropertyValue('--text-faint').trim() || '#4a5568';

    const maxVal = Math.max(...data.flatMap(d => [d.completed, d.failed]), 1);
    const barWidth = Math.max(4, (chartW / data.length) * 0.4);
    const gap = chartW / data.length;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Gridlines
    ctx.strokeStyle = colorBorder;
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD.top + chartH - (i / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Y labels
      ctx.fillStyle = colorFaint;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round((i / gridLines) * maxVal)), PAD.left - 6, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = PAD.left + i * gap + gap / 2;

      // Completed bar
      const compH = (d.completed / maxVal) * chartH;
      ctx.fillStyle = colorSuccess + 'cc'; // slight transparency
      ctx.beginPath();
      ctx.roundRect(x - barWidth - 1, PAD.top + chartH - compH, barWidth, compH, [2, 2, 0, 0]);
      ctx.fill();

      // Failed bar
      const failH = (d.failed / maxVal) * chartH;
      ctx.fillStyle = colorDanger + 'cc';
      ctx.beginPath();
      ctx.roundRect(x + 1, PAD.top + chartH - failH, barWidth, failH, [2, 2, 0, 0]);
      ctx.fill();

      // X label (date abbreviated)
      const label = d.date.slice(5); // MM-DD
      ctx.fillStyle = colorMuted;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, PAD.top + chartH + 20);
    });
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-faint)',
          fontSize: '0.875rem',
        }}
      >
        No run data yet
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          marginBottom: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', display: 'inline-block' }} aria-hidden="true" />
          Completed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--danger)', display: 'inline-block' }} aria-hidden="true" />
          Failed
        </span>
      </div>
      <div className="chart-container" style={{ height }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
          aria-label="Workflow run chart"
          role="img"
        />
      </div>
    </div>
  );
}
