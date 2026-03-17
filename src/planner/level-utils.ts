import { Ceiling, Floor, Level, Wall } from '@/src/model/types';

interface LevelGeometryInput {
  levels: Level[];
  walls: Wall[];
  floors: Floor[];
  ceilings: Ceiling[];
}

function getHighestGeometryRelativePoint(
  levelIndex: number,
  { walls, floors, ceilings }: LevelGeometryInput,
) {
  const wallTop = walls
    .filter((wall) => (wall.level ?? 0) === levelIndex)
    .reduce((max, wall) => Math.max(max, wall.height), 0);

  const floorTop = floors
    .filter((floor) => (floor.level ?? 0) === levelIndex)
    .reduce((max, floor) => Math.max(max, floor.elevation + floor.thickness), 0);

  const ceilingTop = ceilings
    .filter((ceiling) => (ceiling.level ?? 0) === levelIndex)
    .reduce((max, ceiling) => Math.max(max, ceiling.height + ceiling.thickness), 0);

  return Math.max(wallTop, floorTop, ceilingTop);
}

export function getRequiredLevelHeight(
  levelIndex: number,
  input: LevelGeometryInput,
) {
  const level = input.levels[levelIndex];
  if (!level) {
    return 0;
  }

  const geometryTop = getHighestGeometryRelativePoint(levelIndex, input);
  return Math.max(level.height, geometryTop);
}

export function getSuggestedLevelElevation(
  levelIndex: number,
  input: LevelGeometryInput,
) {
  if (levelIndex <= 0) {
    return 0;
  }

  const previousLevel = input.levels[levelIndex - 1];
  if (!previousLevel) {
    return 0;
  }

  return previousLevel.elevation + getRequiredLevelHeight(levelIndex - 1, input);
}

export function cascadeLevelElevationsFrom(
  lockedThroughIndex: number,
  input: LevelGeometryInput,
) {
  const nextLevels = input.levels.map((level) => ({ ...level }));

  for (let index = Math.max(lockedThroughIndex + 1, 1); index < nextLevels.length; index += 1) {
    const previousLevel = nextLevels[index - 1];
    nextLevels[index].elevation =
      previousLevel.elevation +
      getRequiredLevelHeight(index - 1, {
        ...input,
        levels: nextLevels,
      });
  }

  return nextLevels;
}
