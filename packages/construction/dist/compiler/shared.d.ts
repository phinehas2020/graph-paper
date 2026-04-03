import type { ConstructionDiagnostic } from '../schema/diagnostics';
import type { RulePack } from '../schema/rulepacks';
import type { ConstructionComponentDiscipline, ConstructionComponentResult, ConstructionMember, ConstructionMemberCategory, ConstructionMemberType, Vec2, Vec3 } from '../schema/construction-graph';
import type { QuantityLine } from '../schema/quantities';
export declare function lineLength(start: Vec2, end: Vec2): number;
export declare function pathLength(path: Vec3[]): number;
export declare function polygonArea(points: Vec2[]): number;
export declare function polygonPerimeter(points: Vec2[]): number;
export declare function polygonCentroid(points: Vec2[]): Vec2 | null;
export declare function polygonBounds(points: Vec2[]): {
    minX: number;
    minZ: number;
    maxX: number;
    maxZ: number;
    width: number;
    depth: number;
} | null;
type MemberInput = {
    id: string;
    sourceNodeId: string;
    scopeId: string;
    levelId: string | null;
    assemblyId: string;
    type: ConstructionMemberType;
    category: ConstructionMemberCategory;
    label: string;
    materialCode: string;
    unit: QuantityLine['unit'];
    quantity: number;
    count: number;
    start?: Vec3;
    end?: Vec3;
    metadata?: Record<string, unknown>;
};
export declare function createMember(input: MemberInput): ConstructionMember;
export declare function createPointMember(input: Omit<MemberInput, 'start' | 'end'> & {
    point: Vec3;
    height?: number;
}): ConstructionMember;
export declare function createSurfaceMember(input: Omit<MemberInput, 'start' | 'end'> & {
    centroid: Vec2 | null;
    elevation?: number;
    span?: number;
}): ConstructionMember;
export declare function finalizeComponentResult(input: {
    sourceNodeId: string;
    sourceNodeType: string;
    discipline: ConstructionComponentDiscipline;
    levelId: string | null;
    assemblyId: string;
    members: ConstructionMember[];
    diagnostics?: ConstructionDiagnostic[];
    rulePack: RulePack;
}): ConstructionComponentResult;
export {};
//# sourceMappingURL=shared.d.ts.map