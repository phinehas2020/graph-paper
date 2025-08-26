import useStore from '@/src/model/useStore';

/**
 * Triggers a download of the current model state as a JSON file.
 */
export function downloadJSON() {
  const state = useStore.getState();
  const wireSummary = state.selectWireUsageSummary();

  // Create a serializable version of the state.
  // The Zustand store might contain functions (actions, selectors).
  // We only want to serialize the data part (Model interface properties).
  const modelData = {
    measurements: state.measurements,
    textElements: state.textElements,
    flatPieces: state.flatPieces,
    connections: state.connections,
    settings: state.settings,
    wireRuns: state.wireRuns,
    wireUsageSummary: wireSummary,
  };

  const jsonString = JSON.stringify(modelData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `model-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
  document.body.appendChild(a); // Required for Firefox
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
