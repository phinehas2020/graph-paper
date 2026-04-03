import { z } from 'zod';
export declare const PlumbingFixtureKind: z.ZodEnum<{
    sink: "sink";
    toilet: "toilet";
    shower: "shower";
    tub: "tub";
    lavatory: "lavatory";
    washer: "washer";
    "water-heater": "water-heater";
}>;
export declare const PlumbingSystemKind: z.ZodEnum<{
    hot: "hot";
    cold: "cold";
    drain: "drain";
    vent: "vent";
}>;
export declare const PlumbingFixtureNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`pfixture_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"plumbing-fixture">>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    fixtureType: z.ZodDefault<z.ZodEnum<{
        sink: "sink";
        toilet: "toilet";
        shower: "shower";
        tub: "tub";
        lavatory: "lavatory";
        washer: "washer";
        "water-heater": "water-heater";
    }>>;
    roomType: z.ZodDefault<z.ZodString>;
    pipeMaterial: z.ZodDefault<z.ZodString>;
    drainDiameter: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const SupplyRunNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`supply_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"supply-run">>;
    path: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>>;
    systemKind: z.ZodDefault<z.ZodEnum<{
        hot: "hot";
        cold: "cold";
    }>>;
    pipeMaterial: z.ZodDefault<z.ZodString>;
    diameter: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const DrainRunNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`drain_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"drain-run">>;
    path: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>>;
    pipeMaterial: z.ZodDefault<z.ZodString>;
    diameter: z.ZodDefault<z.ZodNumber>;
    slope: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const VentRunNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`vent_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"vent-run">>;
    path: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>>;
    pipeMaterial: z.ZodDefault<z.ZodString>;
    diameter: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type PlumbingFixtureKind = z.infer<typeof PlumbingFixtureKind>;
export type PlumbingSystemKind = z.infer<typeof PlumbingSystemKind>;
export type PlumbingFixtureNode = z.infer<typeof PlumbingFixtureNode>;
export type SupplyRunNode = z.infer<typeof SupplyRunNode>;
export type DrainRunNode = z.infer<typeof DrainRunNode>;
export type VentRunNode = z.infer<typeof VentRunNode>;
//# sourceMappingURL=plumbing.d.ts.map