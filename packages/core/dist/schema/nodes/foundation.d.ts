import { z } from 'zod';
export declare const FoundationKind: z.ZodEnum<{
    "slab-on-grade": "slab-on-grade";
    crawlspace: "crawlspace";
    basement: "basement";
}>;
export declare const FootingRunNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`footing_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"footing-run">>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    thickness: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const StemWallNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`stem_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"stem-wall">>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    thickness: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const PierNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`pier_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"pier">>;
    center: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const ColumnNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`column_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"column">>;
    center: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
    materialCode: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const FoundationSystemNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`foundation_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"foundation-system">>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`footing_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`stem_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`pier_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`column_${string}`>>]>>>;
    foundationKind: z.ZodDefault<z.ZodEnum<{
        "slab-on-grade": "slab-on-grade";
        crawlspace: "crawlspace";
        basement: "basement";
    }>>;
    footingWidth: z.ZodDefault<z.ZodNumber>;
    footingDepth: z.ZodDefault<z.ZodNumber>;
    stemWallThickness: z.ZodDefault<z.ZodNumber>;
    rebarProfile: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type FoundationKind = z.infer<typeof FoundationKind>;
export type FootingRunNode = z.infer<typeof FootingRunNode>;
export type StemWallNode = z.infer<typeof StemWallNode>;
export type PierNode = z.infer<typeof PierNode>;
export type ColumnNode = z.infer<typeof ColumnNode>;
export type FoundationSystemNode = z.infer<typeof FoundationSystemNode>;
//# sourceMappingURL=foundation.d.ts.map