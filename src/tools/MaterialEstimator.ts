import { Wall, MaterialsEstimate } from '../model/types';

// Represents 16 inches (16/12 feet)
export const STUD_SPACING_UNITS = 1.33;

/**
 * Calculates material requirements based on wall definitions.
 * @param walls - Array of walls from the store.
 * @param studPrice - Cost per individual stud.
 * @returns Material estimates including totals and cost.
 */
export function estimateMaterials(
  walls: Wall[],
  studPrice: number = 0
): MaterialsEstimate {
  const totalWallLength = walls.reduce((sum, wall) => {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    return sum + Math.hypot(dx, dy);
  }, 0);

  const studCount =
    totalWallLength > 0
      ? Math.floor(totalWallLength / STUD_SPACING_UNITS) + 1
      : 0;

  const totalStudCost = studCount * studPrice;

  return {
    totalWallLength,
    studCount,
    studPrice,
    totalStudCost,
  };
}
