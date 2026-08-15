const {
  evaluateMonitoringAlerts,
  isHighErrorRate,
} = require('../../src/utils/contractMonitoringAlerts');

describe('contractMonitoringAlerts', () => {
  it('detects high error rate after minimum sample', () => {
    expect(isHighErrorRate(1, 9)).toBe(false);
    expect(isHighErrorRate(2, 10)).toBe(true);
  });

  it('builds alert payload', () => {
    const alerts = evaluateMonitoringAlerts(
      { totalEvents: 20, settlementFailed: 3, errorEvents: 5 },
      true
    );

    expect(alerts.paused).toBe(true);
    expect(alerts.failedSettlementAlert).toBe(true);
    expect(alerts.highErrorRate).toBe(true);
  });
});
