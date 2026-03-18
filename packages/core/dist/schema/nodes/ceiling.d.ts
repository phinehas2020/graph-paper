import { z } from 'zod';
export declare const CeilingNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`ceiling_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"ceiling">>;
    children: z.ZodDefault<z.ZodArray<z.ZodDefault<z.ZodTemplateLiteral<`item_${string}`>>>>;
    polygon: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    holes: z.ZodDefault<z.ZodArray<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>>;
    height: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type CeilingNode = z.infer<typeof CeilingNode>;
//# sourceMappingURL=ceiling.d.ts.map