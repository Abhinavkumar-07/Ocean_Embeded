import { describe, it, expect } from 'vitest';
import { generateValidationResult } from '../data/demoData';
import { generateFullReconstruction } from '../data/demoData';

describe('Phase 6: Validation Result Tests', () => {
  const reconstruction = generateFullReconstruction('2020-02-15', 'Bay of Bengal', 'oceanembed', 7, ['sst']);

  it('generates deterministic validation results (Demo Determinism)', () => {
    const res1 = generateValidationResult(reconstruction);
    const res2 = generateValidationResult(reconstruction);
    expect(res1.overallMetrics.overallRMSE).toEqual(res2.overallMetrics.overallRMSE);
    expect(res1.validationPoints[0].error).toEqual(res2.validationPoints[0].error);
  });

  it('uses the correct error convention: error = predicted - observed', () => {
    const res = generateValidationResult(reconstruction);
    const point = res.validationPoints[0];
    const expectedError = point.predictedTemperature - point.observedTemperature;
    expect(point.error).toBeCloseTo(expectedError, 5);
  });

  it('calculates aggregate metrics from canonical ValidationPoint[]', () => {
    const res = generateValidationResult(reconstruction);
    const errors = res.validationPoints.map(p => p.error);
    const count = errors.length;
    
    // RMSE
    const expectedRMSE = Math.sqrt(errors.reduce((s, e) => s + e*e, 0) / count);
    expect(res.overallMetrics.overallRMSE).toBeCloseTo(expectedRMSE, 5);
    
    // MAE
    const expectedMAE = errors.reduce((s, e) => s + Math.abs(e), 0) / count;
    expect(res.overallMetrics.overallMAE).toBeCloseTo(expectedMAE, 5);
    
    // Bias
    const expectedBias = errors.reduce((s, e) => s + e, 0) / count;
    expect(res.overallMetrics.overallBias).toBeCloseTo(expectedBias, 5);
  });

  it('interpolates profiles to standard depths exactly', () => {
    const res = generateValidationResult(reconstruction);
    const depths = new Set(res.validationPoints.map(p => p.depth));
    const STANDARD_DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000];
    STANDARD_DEPTHS.forEach(d => {
      expect(depths.has(d)).toBe(true);
    });
  });

  it('matches profiles within the requested region bounding box', () => {
    const res = generateValidationResult(reconstruction);
    expect(res.reconstructionRegion).toBe('Bay of Bengal');
    expect(res.matchedProfiles.length).toBeGreaterThan(0);
    // Since we know Bay of Bengal is approx lat 5-23, lon 78-100
    res.matchedProfiles.forEach(p => {
      expect(p.lat).toBeGreaterThanOrEqual(5);
      expect(p.lat).toBeLessThanOrEqual(23);
      expect(p.lon).toBeGreaterThanOrEqual(78);
      expect(p.lon).toBeLessThanOrEqual(100);
    });
  });

  it('calculates band metrics correctly', () => {
    const res = generateValidationResult(reconstruction);
    // Upper ocean: 0-50m
    const upperPts = res.validationPoints.filter(p => p.depth >= 0 && p.depth <= 50);
    const upperErrs = upperPts.map(p => p.error);
    const expectedUpperRMSE = Math.sqrt(upperErrs.reduce((s, e) => s + e*e, 0) / upperErrs.length);
    expect(res.bandMetrics.upperOcean.rmse).toBeCloseTo(expectedUpperRMSE, 5);
  });
});
