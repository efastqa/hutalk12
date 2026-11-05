import { CourierCalculation, CourierSpeed } from '../types';

export const SRI_LANKA_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
] as const;

export const WESTERN_PROVINCE = ['Colombo', 'Gampaha', 'Kalutara'];
export const REMOTE_DISTRICTS = [
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Nuwara Eliya',
  'Monaragala',
];

export const DEFAULT_FREE_DELIVERY_THRESHOLD = 7500; // Rs 7,500 threshold for free delivery

export function calculateCourierFee(
  merchantDistrict: string,
  buyerDistrict: string,
  subtotal: number,
  speed: CourierSpeed = 'standard',
  freeThreshold = DEFAULT_FREE_DELIVERY_THRESHOLD
): CourierCalculation {
  const normMerchant = (merchantDistrict || '').trim();
  const normBuyer = (buyerDistrict || '').trim();

  // Self pickup
  if (speed === 'pickup') {
    return {
      courierFee: 0,
      isFreeDelivery: true,
      freeDeliveryThreshold: freeThreshold,
      amountNeededForFree: 0,
      freeDeliveryProgressPercent: 100,
      tierName: 'Store Self-Pickup',
      estimatedDays: 'Ready in 1–2 hours at store',
      recommendedService: 'In-store collection / Click & Collect',
    };
  }

  // Calculate base fee based on origin and destination
  let baseFee = 500;
  let tierName = 'Islandwide Outstation Courier';
  let estimatedDays = '2 – 3 Business Days';
  let recommendedService = 'Domex / Koombiyo / Pronto';

  const isSameDistrict =
    normMerchant && normBuyer && normMerchant.toLowerCase() === normBuyer.toLowerCase();
  const isMerchantWestern = WESTERN_PROVINCE.includes(normMerchant);
  const isBuyerWestern = WESTERN_PROVINCE.includes(normBuyer);
  const isBuyerRemote = REMOTE_DISTRICTS.includes(normBuyer);

  if (isSameDistrict) {
    baseFee = 350;
    tierName = 'Same District Local Delivery';
    estimatedDays = '1 – 2 Business Days';
    recommendedService = 'Local City Courier / Domex';
  } else if (isMerchantWestern && isBuyerWestern) {
    baseFee = 400;
    tierName = 'Greater Western Province Delivery';
    estimatedDays = '1 – 2 Business Days';
    recommendedService = 'Domex / Pronto Express';
  } else if (isBuyerRemote) {
    baseFee = 650;
    tierName = 'Remote District Delivery';
    estimatedDays = '2 – 4 Business Days';
    recommendedService = 'Pronto / Domex Regional Hub';
  } else {
    baseFee = 500;
    tierName = 'Islandwide Outstation Delivery';
    estimatedDays = '2 – 3 Business Days';
    recommendedService = 'Domex / Prompt Xpress / Koombiyo';
  }

  // Express surcharge (only applicable to standard/express options)
  if (speed === 'express') {
    baseFee += 250;
    tierName = 'Priority Express Courier';
    estimatedDays = 'Same-Day / Next-Day Delivery';
    recommendedService = 'Prompt Xpress / PickMe Flash / Express Rider';
  }

  // Free delivery logic
  const isFreeDelivery = subtotal >= freeThreshold;
  const amountNeededForFree = Math.max(0, freeThreshold - subtotal);
  const freeDeliveryProgressPercent = Math.min(
    100,
    Math.round((subtotal / freeThreshold) * 100)
  );

  return {
    courierFee: isFreeDelivery ? 0 : baseFee,
    isFreeDelivery,
    freeDeliveryThreshold: freeThreshold,
    amountNeededForFree,
    freeDeliveryProgressPercent,
    tierName: isFreeDelivery ? `${tierName} (FREE PROMOTION)` : tierName,
    estimatedDays,
    recommendedService,
  };
}
