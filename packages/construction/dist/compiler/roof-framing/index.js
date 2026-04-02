import { createEmptyEstimate } from '../../estimate/build-estimate';
export function compileRoofFraming(currency = 'USD') {
    return {
        members: [],
        quantities: [],
        estimate: createEmptyEstimate(currency),
        diagnostics: [],
    };
}
