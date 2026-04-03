import { z } from 'zod';
export declare const DeviceBoxKind: z.ZodEnum<{
    outlet: "outlet";
    switch: "switch";
    "smoke-co": "smoke-co";
    data: "data";
    dedicated: "dedicated";
}>;
export declare const LightFixtureKind: z.ZodEnum<{
    "ceiling-light": "ceiling-light";
    fan: "fan";
    recessed: "recessed";
    "exterior-light": "exterior-light";
}>;
export declare const CircuitKind: z.ZodEnum<{
    lighting: "lighting";
    general: "general";
    appliance: "appliance";
    "low-voltage": "low-voltage";
}>;
export declare const RunPathMode: z.ZodEnum<{
    manual: "manual";
    assisted: "assisted";
}>;
export declare const WireRunNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`wire_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"wire-run">>;
    path: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>>;
    circuitId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    wireType: z.ZodDefault<z.ZodString>;
    homerun: z.ZodDefault<z.ZodBoolean>;
    pathMode: z.ZodDefault<z.ZodEnum<{
        manual: "manual";
        assisted: "assisted";
    }>>;
}, z.core.$strip>;
export declare const SwitchLegNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`sleg_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"switch-leg">>;
    path: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>>;
    circuitId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    wireType: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const CircuitNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`circuit_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"circuit">>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`wire_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`sleg_${string}`>>]>>>;
    label: z.ZodDefault<z.ZodString>;
    breakerAmps: z.ZodDefault<z.ZodNumber>;
    voltage: z.ZodDefault<z.ZodNumber>;
    circuitType: z.ZodDefault<z.ZodEnum<{
        lighting: "lighting";
        general: "general";
        appliance: "appliance";
        "low-voltage": "low-voltage";
    }>>;
}, z.core.$strip>;
export declare const ElectricalPanelNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`epanel_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"electrical-panel">>;
    children: z.ZodDefault<z.ZodArray<z.ZodDefault<z.ZodTemplateLiteral<`circuit_${string}`>>>>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    amperage: z.ZodDefault<z.ZodNumber>;
    voltage: z.ZodDefault<z.ZodNumber>;
    mainBreakerAmps: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const DeviceBoxNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`device_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"device-box">>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    deviceType: z.ZodDefault<z.ZodEnum<{
        outlet: "outlet";
        switch: "switch";
        "smoke-co": "smoke-co";
        data: "data";
        dedicated: "dedicated";
    }>>;
    wallId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    circuitId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    mountHeight: z.ZodDefault<z.ZodNumber>;
    voltage: z.ZodDefault<z.ZodNumber>;
    wireType: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const LightFixtureNode: z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`fixture_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"light-fixture">>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    fixtureType: z.ZodDefault<z.ZodEnum<{
        "ceiling-light": "ceiling-light";
        fan: "fan";
        recessed: "recessed";
        "exterior-light": "exterior-light";
    }>>;
    circuitId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    mountHeight: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type DeviceBoxKind = z.infer<typeof DeviceBoxKind>;
export type LightFixtureKind = z.infer<typeof LightFixtureKind>;
export type CircuitKind = z.infer<typeof CircuitKind>;
export type RunPathMode = z.infer<typeof RunPathMode>;
export type WireRunNode = z.infer<typeof WireRunNode>;
export type SwitchLegNode = z.infer<typeof SwitchLegNode>;
export type CircuitNode = z.infer<typeof CircuitNode>;
export type ElectricalPanelNode = z.infer<typeof ElectricalPanelNode>;
export type DeviceBoxNode = z.infer<typeof DeviceBoxNode>;
export type LightFixtureNode = z.infer<typeof LightFixtureNode>;
//# sourceMappingURL=electrical.d.ts.map