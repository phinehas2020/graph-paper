import { createEmptyEstimate } from '../../estimate/build-estimate';
export function compileFloorFraming(currency = 'USD') {
    return {
        members: [],
        quantities: [],
        estimate: createEmptyEstimate(currency),
        diagnostics: [],
    };
}
