import type { ConstructionMember, ConstructionMemberCategory, ConstructionMemberType, Vec3 } from '../../schema/construction-graph';
export declare function distance2D(start: [number, number], end: [number, number]): number;
export declare function distance3D(start: Vec3, end: Vec3): number;
export declare function polygonArea2D(points: Array<[number, number]>): number;
export declare function centroid2D(points: Array<[number, number]>): [number, number] | null;
export declare function getPlanBasis(angleRadians: number): {
    direction: [number, number];
    normal: [number, number];
};
export declare function projectPlanPoint(point: [number, number], axis: [number, number]): number;
export declare function getProjectedBounds(points: Array<[number, number]>, angleRadians: number): {
    direction: [number, number];
    normal: [number, number];
    minAlongDirection: number;
    maxAlongDirection: number;
    minAlongNormal: number;
    maxAlongNormal: number;
};
export declare function fromBasis(alongDirection: number, alongNormal: number, direction: [number, number], normal: [number, number]): [number, number];
type BaseMemberInput = {
    id: string;
    wallId: string;
    levelId: string | null;
    sourceNodeId: string;
    assemblyId: string;
    type: ConstructionMemberType;
    category: ConstructionMemberCategory;
    label: string;
    materialCode: string;
    unit: ConstructionMember['unit'];
    quantity: number;
    count?: number;
    metadata?: Record<string, unknown>;
};
export declare function createLinearMember(input: BaseMemberInput & {
    start: Vec3;
    end: Vec3;
    thickness?: number;
    depth?: number;
}): ConstructionMember;
export declare function createPointMember(input: BaseMemberInput & {
    center: Vec3;
    size?: Vec3;
}): ConstructionMember;
export {};
//# sourceMappingURL=pass-utils.d.ts.map