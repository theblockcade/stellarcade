/**
 * AnalyticsDashboard Page
 * 
 * Demonstrates integration of AnalyticsRangeSwitcher for chart filtering
 */

import React, { useState } from 'react';
import { AnalyticsRangeSwitcher, type TimeRange } from '../components/v1/AnalyticsRangeSwitcher';
import { CampaignRewardsSpotlightCard } from '../components/v1/CampaignRewardsSpotlightCard';
import { DashboardEmptyPanelShell } from '../components/v1/DashboardEmptyPanelShell';
import { StatusPill } from '../components/v1/StatusPill';

interface ChartData {
  label: string;
  value: number;
  change: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<string>('7d');
  const [loading, setLoading] = useState<boolean>(false);

  const timeRanges: TimeRange[] = [
    { id: '24h', label: '24 Hours', shortLabel: '24H', value: '24h' },
    { id: '7d', label: '7 Days', shortLabel: '7D', value: '7d' },
    { id: '30d', label: '30 Days', shortLabel: '30D', value: '30d' },
    { id: '90d', label: '90 Days', shortLabel: '90D', value: '90d' },
    { id: '1y', label: '1 Year', shortLabel: '1Y', value: '1y' },
  ];

  // Mock data that changes based on selected range
  const getChartData = (rangeId: string): ChartData[] => {
    const baseData = {
      '24h': [
        { label: 'Active Players', value: 1234, change: 5.2 },
        { label: 'Games Played', value: 567, change: -2.1 },
        { label: 'Revenue (XLM)', value: 89.45, change: 12.3 },
        { label: 'Avg Session Time', value: 15.6, change: 8.7 },
      ],
      '7d': [
        { label: 'Active Players', value: 8901, change: 15.4 },
        { label: 'Games Played', value: 4567, change: 8.9 },
        { label: 'Revenue (XLM)', value: 678.90, change: 22.1 },
        { label: 'Avg Session Time', value: 18.2, change: 3.4 },
      ],
      '30d': [
        { label: 'Active Players', value: 34567, change: 28.7 },
        { label: 'Games Played', value: 18901, change: 19.5 },
        { label: 'Revenue (XLM)', value: 2345.67, change: 35.2 },
        { label: 'Avg Session Time', value: 21.8, change: -1.2 },
      ],
      '90d': [
        { label: 'Active Players', value: 89012, change: 42.3 },
        { label: 'Games Played', value: 56789, change: 31.8 },
        { label: 'Revenue (XLM)', value: 7890.12, change: 48.9 },
        { label: 'Avg Session Time', value: 19.4, change: -5.6 },
      ],
      '1y': [
        { label: 'Active Players', value: 345678, change: 156.7 },
        { label: 'Games Played', value: 234567, change: 89.4 },
        { label: 'Revenue (XLM)', value: 34567.89, change: 234.5 },
        { label: 'Avg Session Time', value: 22.1, change: 12.8 },
      ],
    };

    return baseData[rangeId as keyof typeof baseData] || baseData['7d'];
  };

  const handleRangeChange = (rangeId: string, _range: TimeRange) => {
    setLoading(true);
    setSelectedRange(rangeId);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const chartData = getChartData(selectedRange);
  const sparseModules = [
    {
      id: 'campaign-latency',
      title: 'Campaign latency monitor',
      description: 'No campaign latency snapshots are available yet for this range.',
    },
    {
      id: 'reward-anomalies',
      title: 'Reward anomaly tracker',
      description: 'Reward outlier tracking is waiting for enough payout samples.',
    },
  ];

  const formatValue = (value: number, label: string): string => {
    if (label.includes('Revenue')) {
      return `${value.toLocaleString()} XLM`;
    }
    if (label.includes('Time')) {
      return `${value}min`;
    }
    return value.toLocaleString();
  };

  const getChangeTone = (change: number) => {
    if (change > 0) return 'success';
    if (change < 0) return 'error';
    return 'neutral';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Analytics Dashboard</h1>
        <p style={{ color: '#a8b5c8' }}>
          Monitor platform performance and user engagement metrics
        </p>
      </header>
      <div style={{ marginBottom: '1.5rem' }}>
        <CampaignRewardsSpotlightCard
          activeCampaigns={3}
          pendingRewardsLabel="12 claims"
          onViewCampaigns={() => setSelectedRange('30d')}
          onClaimRewards={() => setSelectedRange('7d')}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0 }}>Performance Metrics</h2>
          <AnalyticsRangeSwitcher
            ranges={timeRanges}
            selectedId={selectedRange}
            onChange={handleRangeChange}
            loading={loading}
            testId="analytics-dashboard-range-switcher"
          />
        </div>

        {loading && (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#a8b5c8',
            border: '1px dashed #333',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            Loading analytics data for {timeRanges.find(r => r.id === selectedRange)?.label}...
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem',
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 0.3s ease'
        }}>
          {chartData.map((metric) => (
            <div 
              key={metric.label}
              style={{ 
                padding: '1.5rem', 
                border: '1px solid #333', 
                borderRadius: '0.75rem',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '0.875rem',
                  color: '#a8b5c8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {metric.label}
                </h3>
                <StatusPill 
                  tone={getChangeTone(metric.change)}
                  label={`${metric.change > 0 ? '+' : ''}${metric.change.toFixed(1)}%`}
                  size="compact"
                />
              </div>
              
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#f5f7fb',
                marginBottom: '0.5rem'
              }}>
                {formatValue(metric.value, metric.label)}
              </div>
              
              <div style={{ 
                height: '60px', 
                background: 'linear-gradient(90deg, rgba(125, 226, 209, 0.1) 0%, rgba(125, 226, 209, 0.3) 100%)',
                borderRadius: '0.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Mock chart visualization */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${Math.min(80, Math.abs(metric.change) * 2)}%`,
                  background: metric.change > 0 
                    ? 'linear-gradient(180deg, rgba(125, 226, 209, 0.6) 0%, rgba(125, 226, 209, 0.2) 100%)'
                    : 'linear-gradient(180deg, rgba(255, 109, 135, 0.6) 0%, rgba(255, 109, 135, 0.2) 100%)',
                  transition: 'height 0.5s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <section style={{ marginTop: '2rem' }} aria-label="Sparse dashboard modules">
        <h2 style={{ marginBottom: '0.75rem' }}>Sparse Modules</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {sparseModules.map((module) => (
            <DashboardEmptyPanelShell
              key={module.id}
              title={module.title}
              description={module.description}
              actionLabel="Backfill module"
              onAction={() => setSelectedRange('90d')}
              testId={`sparse-module-${module.id}`}
            />
          ))}
        </div>
      </section>

      <div style={{ 
        marginTop: '3rem',
        padding: '1.5rem',
        border: '1px solid #333',
        borderRadius: '0.75rem',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Chart Integration Example</h3>
        <p style={{ color: '#a8b5c8', marginBottom: '1rem' }}>
          The AnalyticsRangeSwitcher component can be easily integrated with charting libraries 
          like Chart.js, D3, or Recharts. The selected time range is passed to your data fetching 
          logic to update charts dynamically.
        </p>
        
        <div style={{ 
          padding: '2rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          color: '#a8b5c8'
        }}>
          <div>// Example integration:</div>
          <div style={{ color: '#7de2d1' }}>
            const handleRangeChange = (rangeId, range) =&gt; &#123;
          </div>
          <div style={{ paddingLeft: '1rem' }}>
            <div>setLoading(true);</div>
            <div>fetchChartData(range.value).then(data =&gt; &#123;</div>
            <div style={{ paddingLeft: '1rem' }}>
              <div>updateChart(data);</div>
              <div>setLoading(false);</div>
            </div>
            <div>&#125;);</div>
          </div>
          <div style={{ color: '#7de2d1' }}>&#125;;</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
