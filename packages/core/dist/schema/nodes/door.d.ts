import { z } from 'zod';
export declare const DoorSegment: z.ZodObject<{
    type: z.ZodEnum<{
        panel: "panel";
        glass: "glass";
        empty: "empty";
    }>;
    heightRatio: z.ZodNumber;
    columnRatios: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    dividerThickness: z.ZodDefault<z.ZodNumber>;
    panelDepth: z.ZodDefault<z.ZodNumber>;
    panelInset: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type DoorSegment = z.infer<typeof DoorSegment>;
export declare const DoorNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`door_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"door">>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    side: z.ZodOptional<z.ZodEnum<{
        front: "front";
        back: "back";
    }>>;
    wallId: z.ZodOptional<z.ZodString>;
    width: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
    frameThickness: z.ZodDefault<z.ZodNumber>;
    frameDepth: z.ZodDefault<z.ZodNumber>;
    threshold: z.ZodDefault<z.ZodBoolean>;
    thresholdHeight: z.ZodDefault<z.ZodNumber>;
    hingesSide: z.ZodDefault<z.ZodEnum<{
        left: "left";
        right: "right";
    }>>;
    swingDirection: z.ZodDefault<z.ZodEnum<{
        inward: "inward";
        outward: "outward";
    }>>;
    segments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            panel: "panel";
            glass: "glass";
            empty: "empty";
        }>;
        heightRatio: z.ZodNumber;
        columnRatios: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
        dividerThickness: z.ZodDefault<z.ZodNumber>;
        panelDepth: z.ZodDefault<z.ZodNumber>;
        panelInset: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>>;
    handle: z.ZodDefault<z.ZodBoolean>;
    handleHeight: z.ZodDefault<z.ZodNumber>;
    handleSide: z.ZodDefault<z.ZodEnum<{
        left: "left";
        right: "right";
    }>>;
    contentPadding: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    doorCloser: z.ZodDefault<z.ZodBoolean>;
    panicBar: z.ZodDefault<z.ZodBoolean>;
    panicBarHeight: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type DoorNode = z.infer<typeof DoorNode>;
//# sourceMappingURL=door.d.ts.map