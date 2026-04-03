import { z } from 'zod';
export declare const BlockingKind: z.ZodEnum<{
    solid: "solid";
    bridging: "bridging";
}>;
export declare const FloorFramingKind: z.ZodEnum<{
    "dimensional-lumber": "dimensional-lumber";
    "i-joist": "i-joist";
    "floor-truss": "floor-truss";
}>;
export declare const RimMode: z.ZodEnum<{
    "rim-board": "rim-board";
    "solid-blocking": "solid-blocking";
    "open-web": "open-web";
}>;
export declare const FloorOpeningNode: z.ZodObject<{
    object: z.ZodDefault<z.ZodLiteral<"node">>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    color: z.ZodOptional<z.ZodString>;
    camera: z.ZodOptional<z.ZodObject<{
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        target: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        mode: z.ZodDefault<z.ZodEnum<{
            perspective: "perspective";
            orthographic: "orthographic";
        }>>;
        fov: z.ZodOptional<z.ZodNumber>;
        zoom: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodJSONSchema>>;
    id: z.ZodDefault<z.ZodTemplateLiteral<`fopen_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"floor-opening">>;
    polygon: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>;
    curbHeight: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const BlockingRunNode: z.ZodObject<{
    object: z.ZodDefault<z.ZodLiteral<"node">>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    color: z.ZodOptional<z.ZodString>;
    camera: z.ZodOptional<z.ZodObject<{
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        target: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        mode: z.ZodDefault<z.ZodEnum<{
            perspective: "perspective";
            orthographic: "orthographic";
        }>>;
        fov: z.ZodOptional<z.ZodNumber>;
        zoom: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodJSONSchema>>;
    id: z.ZodDefault<z.ZodTemplateLiteral<`block_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"blocking-run">>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    kind: z.ZodDefault<z.ZodEnum<{
        solid: "solid";
        bridging: "bridging";
    }>>;
    spacing: z.ZodDefault<z.ZodNumber>;
    materialCode: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const FloorSystemNode: z.ZodObject<{
    object: z.ZodDefault<z.ZodLiteral<"node">>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    color: z.ZodOptional<z.ZodString>;
    camera: z.ZodOptional<z.ZodObject<{
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        target: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        mode: z.ZodDefault<z.ZodEnum<{
            perspective: "perspective";
            orthographic: "orthographic";
        }>>;
        fov: z.ZodOptional<z.ZodNumber>;
        zoom: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodJSONSchema>>;
    id: z.ZodDefault<z.ZodTemplateLiteral<`floor_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"floor-system">>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`fopen_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`block_${string}`>>]>>>;
    polygon: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>;
    derivedFromSlabId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    framingKind: z.ZodDefault<z.ZodEnum<{
        "dimensional-lumber": "dimensional-lumber";
        "i-joist": "i-joist";
        "floor-truss": "floor-truss";
    }>>;
    joistAngle: z.ZodDefault<z.ZodNumber>;
    joistSpacing: z.ZodDefault<z.ZodNumber>;
    memberDepth: z.ZodDefault<z.ZodNumber>;
    rimMode: z.ZodDefault<z.ZodEnum<{
        "rim-board": "rim-board";
        "solid-blocking": "solid-blocking";
        "open-web": "open-web";
    }>>;
    elevation: z.ZodDefault<z.ZodNumber>;
    sheathingThickness: z.ZodDefault<z.ZodNumber>;
    assemblyId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const BeamLineNode: z.ZodObject<{
    object: z.ZodDefault<z.ZodLiteral<"node">>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    color: z.ZodOptional<z.ZodString>;
    camera: z.ZodOptional<z.ZodObject<{
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        target: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        mode: z.ZodDefault<z.ZodEnum<{
            perspective: "perspective";
            orthographic: "orthographic";
        }>>;
        fov: z.ZodOptional<z.ZodNumber>;
        zoom: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodJSONSchema>>;
    id: z.ZodDefault<z.ZodTemplateLiteral<`beam_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"beam-line">>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    supportFloorSystemId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    materialCode: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const SupportPostNode: z.ZodObject<{
    object: z.ZodDefault<z.ZodLiteral<"node">>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    color: z.ZodOptional<z.ZodString>;
    camera: z.ZodOptional<z.ZodObject<{
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        target: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        mode: z.ZodDefault<z.ZodEnum<{
            perspective: "perspective";
            orthographic: "orthographic";
        }>>;
        fov: z.ZodOptional<z.ZodNumber>;
        zoom: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodJSONSchema>>;
    id: z.ZodDefault<z.ZodTemplateLiteral<`post_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"support-post">>;
    center: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
    materialCode: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type BlockingKind = z.infer<typeof BlockingKind>;
export type FloorFramingKind = z.infer<typeof FloorFramingKind>;
export type RimMode = z.infer<typeof RimMode>;
export type FloorOpeningNode = z.infer<typeof FloorOpeningNode>;
export type BlockingRunNode = z.infer<typeof BlockingRunNode>;
export type FloorSystemNode = z.infer<typeof FloorSystemNode>;
export type BeamLineNode = z.infer<typeof BeamLineNode>;
export type SupportPostNode = z.infer<typeof SupportPostNode>;
//# sourceMappingURL=floor-system.d.ts.map