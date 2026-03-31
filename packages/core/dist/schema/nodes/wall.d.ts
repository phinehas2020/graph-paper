import { z } from 'zod';
export declare const DEFAULT_WALL_HEIGHT = 2.5;
export declare const WallGuideReference: z.ZodEnum<{
    bottom: "bottom";
    top: "top";
}>;
export declare const WallGuide: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    offset: z.ZodNumber;
    reference: z.ZodDefault<z.ZodEnum<{
        bottom: "bottom";
        top: "top";
    }>>;
    color: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const WallNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`wall_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"wall">>;
    children: z.ZodDefault<z.ZodArray<z.ZodDefault<z.ZodTemplateLiteral<`item_${string}`>>>>;
    thickness: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    frontSide: z.ZodDefault<z.ZodEnum<{
        unknown: "unknown";
        interior: "interior";
        exterior: "exterior";
    }>>;
    backSide: z.ZodDefault<z.ZodEnum<{
        unknown: "unknown";
        interior: "interior";
        exterior: "exterior";
    }>>;
    guides: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodDefault<z.ZodString>;
        offset: z.ZodNumber;
        reference: z.ZodDefault<z.ZodEnum<{
            bottom: "bottom";
            top: "top";
        }>>;
        color: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type WallNode = z.infer<typeof WallNode>;
export type WallGuide = z.infer<typeof WallGuide>;
export type WallGuideReference = z.infer<typeof WallGuideReference>;
export declare const getWallHeight: (wall: Pick<WallNode, "height">) => number;
export declare const getWallLength: (wall: Pick<WallNode, "start" | "end">) => number;
export declare const getWallGuideLocalY: (wall: Pick<WallNode, "height">, guide: Pick<WallGuide, "offset" | "reference">) => number;
//# sourceMappingURL=wall.d.ts.map