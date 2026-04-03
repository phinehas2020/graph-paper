import { z } from 'zod';
export declare const SiteNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`site_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"site">>;
    polygon: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"polygon">;
        points: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    }, z.core.$strip>>>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`building_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`item_${string}`>>]>>>;
}, z.core.$strip>;
export type SiteNode = z.infer<typeof SiteNode>;
//# sourceMappingURL=site.d.ts.map