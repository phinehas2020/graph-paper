import { createEmptyEstimate } from '../../estimate/build-estimate';
export function compileMepSystems(currency = 'USD') {
    return {
        members: [],
        quantities: [],
        estimate: createEmptyEstimate(currency),
        diagnostics: [],
    };
}
