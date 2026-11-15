import React from 'react';
import type { AIUsageRecord } from '@/lib/types';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';

interface AIUsageTableProps {
  records: AIUsageRecord[];
}

export function AIUsageTable({ records }: AIUsageTableProps) {
  if (records.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No AI usage recorded yet.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Provider</th>
            <th>Tokens</th>
            <th>Cost</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => (
            <tr key={i}>
              <td>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    padding: '0.125rem 0.4rem',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  {rec.action}
                </span>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>{rec.provider}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                {formatNumber(rec.tokensUsed)}
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                {formatCurrency(rec.cost)}
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                {formatRelativeTime(rec.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
