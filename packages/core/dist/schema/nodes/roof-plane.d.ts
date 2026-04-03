import { z } from 'zod';
export declare const RoofFramingMode: z.ZodEnum<{
    "truss-array": "truss-array";
    "rafter-set": "rafter-set";
}>;
export declare const TrussArrayNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`truss_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"truss-array">>;
    roofPlaneId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    spacing: z.ZodDefault<z.ZodNumber>;
    heelHeight: z.ZodDefault<z.ZodNumber>;
    overhang: z.ZodDefault<z.ZodNumber>;
    assemblyId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const RafterSetNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`rafter_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"rafter-set">>;
    roofPlaneId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    spacing: z.ZodDefault<z.ZodNumber>;
    ridgeBoardDepth: z.ZodDefault<z.ZodNumber>;
    overhang: z.ZodDefault<z.ZodNumber>;
    assemblyId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const RoofPlaneNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`rplane_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"roof-plane">>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`truss_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`rafter_${string}`>>]>>>;
    polygon: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>;
    pitch: z.ZodDefault<z.ZodNumber>;
    overhang: z.ZodDefault<z.ZodNumber>;
    plateHeight: z.ZodDefault<z.ZodNumber>;
    heelHeight: z.ZodDefault<z.ZodNumber>;
    sheathingThickness: z.ZodDefault<z.ZodNumber>;
    roofingThickness: z.ZodDefault<z.ZodNumber>;
    framingMode: z.ZodDefault<z.ZodEnum<{
        "truss-array": "truss-array";
        "rafter-set": "rafter-set";
    }>>;
    assemblyId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RoofFramingMode = z.infer<typeof RoofFramingMode>;
export type TrussArrayNode = z.infer<typeof TrussArrayNode>;
export type RafterSetNode = z.infer<typeof RafterSetNode>;
export type RoofPlaneNode = z.infer<typeof RoofPlaneNode>;
//# sourceMappingURL=roof-plane.d.ts.map