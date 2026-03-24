import { z } from 'zod';
export declare const RoofType: z.ZodEnum<{
    hip: "hip";
    gable: "gable";
    shed: "shed";
    gambrel: "gambrel";
    dutch: "dutch";
    mansard: "mansard";
    flat: "flat";
}>;
export type RoofType = z.infer<typeof RoofType>;
export declare const RoofSegmentNode: z.ZodObject<{
    object: z.ZodDefault<z.ZodLiteral<"node">>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    visible: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`rseg_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"roof-segment">>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodNumber>;
    roofType: z.ZodDefault<z.ZodEnum<{
        hip: "hip";
        gable: "gable";
        shed: "shed";
        gambrel: "gambrel";
        dutch: "dutch";
        mansard: "mansard";
        flat: "flat";
    }>>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    wallHeight: z.ZodDefault<z.ZodNumber>;
    roofHeight: z.ZodDefault<z.ZodNumber>;
    wallThickness: z.ZodDefault<z.ZodNumber>;
    deckThickness: z.ZodDefault<z.ZodNumber>;
    overhang: z.ZodDefault<z.ZodNumber>;
    shingleThickness: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type RoofSegmentNode = z.infer<typeof RoofSegmentNode>;
//# sourceMappingURL=roof-segment.d.ts.map