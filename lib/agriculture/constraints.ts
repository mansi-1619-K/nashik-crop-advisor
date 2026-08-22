import type { ConstraintMessage, ConstraintResult } from "./results";
import { WATER_AVAILABILITY_INDEX, WATER_DEMAND_REQUIREMENT } from "./weights";
import type { Crop } from "./crop";
import type { FarmerContext } from "./context";
import type { Season } from "./season";
import type { Soil } from "./soil";
import type { Zone } from "./zone";

function violation(
  code: ConstraintMessage["code"],
  factor: ConstraintMessage["factor"],
  message: string,
): ConstraintMessage {
  return { code, factor, message };
}

function rainfallOverlapMm(crop: Crop, zone: Zone): number {
  const overlapMin = Math.max(crop.rainfallRangeMm.min, zone.characteristics.annualRainfallMm.min);
  const overlapMax = Math.min(crop.rainfallRangeMm.max, zone.characteristics.annualRainfallMm.max);
  return Math.max(0, overlapMax - overlapMin);
}

export interface ConstraintInputs {
  context: FarmerContext;
  crop: Crop;
  zone: Zone;
  season: Season | undefined;
  soil: Soil | undefined;
}

export function evaluateConstraints({
  context,
  crop,
  zone,
  season,
  soil,
}: ConstraintInputs): ConstraintResult {
  const violations: ConstraintMessage[] = [];
  const warnings: ConstraintMessage[] = [];

  if (!crop.zones.includes(context.zoneId)) {
    violations.push(
      violation(
        "zone-out-of-range",
        "zone",
        `${crop.name} is not part of the ${zone.name} profile.`,
      ),
    );
  }

  if (!crop.seasons.includes(context.seasonId)) {
    const seasonName = season?.name ?? context.seasonId;
    violations.push(
      violation(
        "season-incompatible",
        "season",
        `${crop.name} is not cultivated in the ${seasonName} window per current knowledge base.`,
      ),
    );
  }

  const available = WATER_AVAILABILITY_INDEX[context.waterAvailability];
  const required = WATER_DEMAND_REQUIREMENT[crop.waterDemand];
  const monsoonSupported =
    context.waterAvailability === "rainfed" &&
    zone.characteristics.annualRainfallMm.min >= 900 &&
    context.seasonId === "kharif";
  if (available < required) {
    if (monsoonSupported) {
      warnings.push(
        violation(
          "water-borderline",
          "water",
          `${crop.name}'s ${crop.waterDemand} water demand is met by monsoon rainfall in this belt; success depends on timely rains.`,
        ),
      );
    } else {
      violations.push(
        violation(
          "water-incompatible",
          "water",
          `${crop.name} has ${crop.waterDemand} water demand which exceeds "${context.waterAvailability}" availability.`,
        ),
      );
    }
  } else if (required > 0 && available === required && available < WATER_AVAILABILITY_INDEX.assured) {
    warnings.push(
      violation(
        "water-borderline",
        "water",
        `${crop.name}'s ${crop.waterDemand} water demand exactly matches "${context.waterAvailability}" availability; little margin in a dry spell.`,
      ),
    );
  }

  const compatibilityEntry = crop.soilCompatibility.find((sc) => sc.soilId === context.soilId);
  if (!compatibilityEntry) {
    warnings.push(
      violation(
        "soil-borderline",
        "soil",
        `No soil compatibility entry recorded for ${crop.name} on this soil; treat score with caution.`,
      ),
    );
  } else if (compatibilityEntry.level === "unsuitable") {
    const soilName = soil?.name ?? context.soilId;
    violations.push(
      violation(
        "soil-severely-incompatible",
        "soil",
        `${crop.name} is rated unsuitable on ${soilName}.`,
      ),
    );
  }

  const overlap = rainfallOverlapMm(crop, zone);
  if (overlap <= 0) {
    if (context.waterAvailability === "rainfed") {
      violations.push(
        violation(
          "climate-severely-incompatible",
          "climate",
          `${crop.name}'s rainfall window (${crop.rainfallRangeMm.min}-${crop.rainfallRangeMm.max} mm) does not overlap the ${zone.name} band (${zone.characteristics.annualRainfallMm.min}-${zone.characteristics.annualRainfallMm.max} mm), and the farm is rainfed.`,
        ),
      );
    } else {
      warnings.push(
        violation(
          "climate-borderline",
          "climate",
          `${crop.name}'s rainfall window does not overlap the ${zone.name} band; the crop would rely entirely on irrigation here.`,
        ),
      );
    }
  } else {
    const coverage = overlap / (crop.rainfallRangeMm.max - crop.rainfallRangeMm.min);
    if (coverage < 0.5) {
      warnings.push(
        violation(
          "climate-borderline",
          "climate",
          `Only ${(coverage * 100).toFixed(0)}% of ${crop.name}'s rainfall range falls inside the ${zone.name} band; climate fit is partial.`,
        ),
      );
    }
  }

  return { eligible: violations.length === 0, violations, warnings };
}
