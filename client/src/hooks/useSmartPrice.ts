import { useMemo } from 'react';
import { ConditionGrade, ItemCategory, PriceEstimationResult } from '../types';

export function calculateSmartPrice(
  originalSrp: number,
  condition: ConditionGrade,
  category?: ItemCategory,
  currentPrice?: number
): PriceEstimationResult {
  if (!originalSrp || originalSrp <= 0) {
    return {
      recommendedMin: 0,
      recommendedMax: 0,
      recommendedAverage: 0,
      dealRating: 'Fair Campus Price',
      estimatedSavingsPct: 0,
      reasoning: 'Enter the original retail price to compute a campus estimate.'
    };
  }

  // Base Condition Depreciation Multipliers
  let minRatio = 0.4;
  let maxRatio = 0.6;

  switch (condition) {
    case 'Brand New':
      minRatio = 0.78;
      maxRatio = 0.90;
      break;
    case 'Like New':
      minRatio = 0.55;
      maxRatio = 0.70;
      break;
    case 'Gently Used':
      minRatio = 0.40;
      maxRatio = 0.55;
      break;
    case 'Fair / Academic Usable':
      minRatio = 0.25;
      maxRatio = 0.38;
      break;
  }

  // Category demand modifier
  let catMultiplier = 1.0;
  if (category === 'Calculators & Electronics') {
    catMultiplier = 1.05; // PRC calculators hold high resale value
  } else if (category === 'Uniforms & Scrubs') {
    catMultiplier = 0.92;
  } else if (category === 'Textbooks & Reviewers') {
    catMultiplier = 0.95;
  }

  const rawMin = originalSrp * minRatio * catMultiplier;
  const rawMax = originalSrp * maxRatio * catMultiplier;

  // Round to nearest 10 or 50 for clean Philippine Peso currency display
  const recommendedMin = Math.max(50, Math.round(rawMin / 10) * 10);
  const recommendedMax = Math.max(recommendedMin + 50, Math.round(rawMax / 10) * 10);
  const recommendedAverage = Math.round((recommendedMin + recommendedMax) / 2);

  // Evaluate current price if provided
  let dealRating: PriceEstimationResult['dealRating'] = 'Fair Campus Price';
  let savingsPct = 0;

  if (currentPrice !== undefined) {
    savingsPct = Math.max(0, Math.round(((originalSrp - currentPrice) / originalSrp) * 100));

    if (currentPrice === 0) {
      dealRating = 'Super Bargain';
    } else if (currentPrice < recommendedMin) {
      dealRating = 'Super Bargain';
    } else if (currentPrice <= recommendedMax) {
      dealRating = 'Fair Campus Price';
    } else if (currentPrice <= recommendedMax * 1.25) {
      dealRating = 'Slightly High';
    } else {
      dealRating = 'Overpriced';
    }
  }

  let reasoning = '';
  switch (condition) {
    case 'Brand New':
      reasoning = `Unused item saves ~${Math.round((1 - (minRatio + maxRatio)/2) * 100)}% off mall retail price while remaining authentic.`;
      break;
    case 'Like New':
      reasoning = `Lightly used for a few sessions with minimal wear. Great sweet-spot value for UC students.`;
      break;
    case 'Gently Used':
      reasoning = `Clean and functional condition with normal academic notes or highlights. Saves up to ~${Math.round((1 - minRatio) * 100)}%.`;
      break;
    case 'Fair / Academic Usable':
      reasoning = `Budget-friendly option for students prioritizing functionality over cosmetic condition.`;
      break;
  }

  return {
    recommendedMin,
    recommendedMax,
    recommendedAverage,
    dealRating,
    estimatedSavingsPct: savingsPct,
    reasoning
  };
}

export function useSmartPrice(
  originalSrp: number,
  condition: ConditionGrade,
  category?: ItemCategory,
  currentPrice?: number
) {
  return useMemo(
    () => calculateSmartPrice(originalSrp, condition, category, currentPrice),
    [originalSrp, condition, category, currentPrice]
  );
}
