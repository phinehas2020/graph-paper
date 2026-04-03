import z from 'zod';
export declare const AnyNode: z.ZodDiscriminatedUnion<[z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`building_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"building">>;
    children: z.ZodDefault<z.ZodArray<z.ZodDefault<z.ZodTemplateLiteral<`level_${string}`>>>>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`item_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`door_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`window_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`device_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`pfixture_${string}`>>]>>>;
    thickness: z.ZodDefault<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    assemblyId: z.ZodOptional<z.ZodString>;
    isExterior: z.ZodDefault<z.ZodBoolean>;
    isBearing: z.ZodDefault<z.ZodBoolean>;
    studSpacing: z.ZodOptional<z.ZodNumber>;
    plateCount: z.ZodOptional<z.ZodNumber>;
    cornerStyle: z.ZodDefault<z.ZodEnum<{
        standard: "standard";
        ladder: "ladder";
        california: "california";
    }>>;
    intersectionStyle: z.ZodDefault<z.ZodEnum<{
        standard: "standard";
        "t-post": "t-post";
        open: "open";
    }>>;
    sheathingAssemblyId: z.ZodOptional<z.ZodString>;
    finishAssemblyId: z.ZodOptional<z.ZodString>;
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
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`item_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"item">>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    scale: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    side: z.ZodOptional<z.ZodEnum<{
        front: "front";
        back: "back";
    }>>;
    children: z.ZodDefault<z.ZodArray<z.ZodDefault<z.ZodTemplateLiteral<`item_${string}`>>>>;
    wallId: z.ZodOptional<z.ZodString>;
    wallT: z.ZodOptional<z.ZodNumber>;
    collectionIds: z.ZodOptional<z.ZodArray<z.ZodCustom<`collection_${string}`, `collection_${string}`>>>;
    asset: z.ZodObject<{
        id: z.ZodString;
        category: z.ZodString;
        name: z.ZodString;
        thumbnail: z.ZodString;
        src: z.ZodString;
        dimensions: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
        attachTo: z.ZodOptional<z.ZodEnum<{
            wall: "wall";
            "wall-side": "wall-side";
            ceiling: "ceiling";
        }>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        offset: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
        rotation: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
        scale: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
        surface: z.ZodOptional<z.ZodObject<{
            height: z.ZodNumber;
        }, z.core.$strip>>;
        interactive: z.ZodOptional<z.ZodObject<{
            controls: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"toggle">;
                label: z.ZodOptional<z.ZodString>;
                default: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"slider">;
                label: z.ZodString;
                min: z.ZodNumber;
                max: z.ZodNumber;
                step: z.ZodDefault<z.ZodNumber>;
                unit: z.ZodOptional<z.ZodString>;
                displayMode: z.ZodDefault<z.ZodEnum<{
                    slider: "slider";
                    stepper: "stepper";
                    dial: "dial";
                }>>;
                default: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"temperature">;
                label: z.ZodDefault<z.ZodString>;
                min: z.ZodDefault<z.ZodNumber>;
                max: z.ZodDefault<z.ZodNumber>;
                unit: z.ZodDefault<z.ZodEnum<{
                    C: "C";
                    F: "F";
                }>>;
                default: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>], "kind">>>;
            effects: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"animation">;
                clips: z.ZodObject<{
                    on: z.ZodOptional<z.ZodString>;
                    off: z.ZodOptional<z.ZodString>;
                    loop: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"light">;
                color: z.ZodDefault<z.ZodString>;
                intensityRange: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
                distance: z.ZodOptional<z.ZodNumber>;
                offset: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
            }, z.core.$strip>], "kind">>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    object: z.ZodDefault<z.ZodLiteral<"node">>;
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`zone_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"zone">>;
    name: z.ZodString;
    polygon: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    roomType: z.ZodDefault<z.ZodString>;
    fixtureProfile: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    color: z.ZodDefault<z.ZodString>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodJSONSchema>>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`slab_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"slab">>;
    polygon: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    holes: z.ZodDefault<z.ZodArray<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>>;
    elevation: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`ceiling_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"ceiling">>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`item_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`fixture_${string}`>>]>>>;
    polygon: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
    holes: z.ZodDefault<z.ZodArray<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>>;
    height: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`roof_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"roof">>;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodNumber>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`rseg_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`rplane_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`truss_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`rafter_${string}`>>]>>>;
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`scan_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"scan">>;
    url: z.ZodString;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    scale: z.ZodDefault<z.ZodNumber>;
    opacity: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`guide_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"guide">>;
    url: z.ZodString;
    position: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    rotation: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>>;
    scale: z.ZodDefault<z.ZodNumber>;
    opacity: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`window_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"window">>;
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
    columnRatios: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    rowRatios: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    columnDividerThickness: z.ZodDefault<z.ZodNumber>;
    rowDividerThickness: z.ZodDefault<z.ZodNumber>;
    sill: z.ZodDefault<z.ZodBoolean>;
    sillDepth: z.ZodDefault<z.ZodNumber>;
    sillThickness: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
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
    leafCount: z.ZodDefault<z.ZodNumber>;
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
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`floor_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"floor-system">>;
    children: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodDefault<z.ZodTemplateLiteral<`fopen_${string}`>>, z.ZodDefault<z.ZodTemplateLiteral<`block_${string}`>>]>>>;
    polygon: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>;
    derivedFromSlabId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    framingKind: z.ZodDefault<z.ZodEnum<{
        "dimensional-lumber": "dimensional-lumber";
        "i-joist": "i-joist";
        "floor-truss": "floor-truss";
    }>>;
    joistAngle: z.ZodDefault<z.ZodNumber>;
    joistSpacing: z.ZodDefault<z.ZodNumber>;
    memberDepth: z.ZodDefault<z.ZodNumber>;
    rimMode: z.ZodDefault<z.ZodEnum<{
        "rim-board": "rim-board";
        "solid-blocking": "solid-blocking";
        "open-web": "open-web";
    }>>;
    elevation: z.ZodDefault<z.ZodNumber>;
    sheathingThickness: z.ZodDefault<z.ZodNumber>;
    assemblyId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`beam_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"beam-line">>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    supportFloorSystemId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    materialCode: z.ZodDefault<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`post_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"support-post">>;
    center: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    width: z.ZodDefault<z.ZodNumber>;
    depth: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
    materialCode: z.ZodDefault<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`fopen_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"floor-opening">>;
    polygon: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>>;
    curbHeight: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
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
    id: z.ZodDefault<z.ZodTemplateLiteral<`block_${string}`>>;
    type: z.ZodDefault<z.ZodLiteral<"blocking-run">>;
    start: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    end: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    kind: z.ZodDefault<z.ZodEnum<{
        solid: "solid";
        bridging: "bridging";
    }>>;
    spacing: z.ZodDefault<z.ZodNumber>;
    materialCode: z.ZodDefault<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
        general: "general";
        lighting: "lighting";
        appliance: "appliance";
        "low-voltage": "low-voltage";
    }>>;
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>, z.ZodObject<{
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
}, z.core.$strip>], "type">;
export type AnyNode = z.infer<typeof AnyNode>;
export type AnyNodeType = AnyNode['type'];
export type AnyNodeId = AnyNode['id'];
//# sourceMappingURL=types.d.ts.map