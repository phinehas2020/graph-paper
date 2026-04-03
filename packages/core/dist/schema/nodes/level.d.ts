import { z } from 'zod';
export declare const LevelNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`level_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"level">>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`wall_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`zone_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`slab_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`ceiling_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`roof_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`scan_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`guide_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`item_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`floor_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`beam_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`post_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`fopen_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`block_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`rplane_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`truss_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`rafter_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`epanel_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`circuit_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`device_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`fixture_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`wire_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`sleg_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`pfixture_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`supply_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`drain_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`vent_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`foundation_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`footing_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`stem_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`pier_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`column_${string}`>>]>>>;
    level: z.ZodDefault<z.ZodNumber>;
    defaultWallAssemblyId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type LevelNode = z.infer<typeof LevelNode>;
//# sourceMappingURL=level.d.ts.map