import useStore from '@/src/model/useStore';
import { generateMesh } from '@/src/three/generateMesh';
import * as THREE from 'three';
// OBJExporter is not directly on the THREE namespace by default with modules.
// It needs to be imported from its specific path.
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

/**
 * Triggers a download of the current model state as a JSON file.
 */
export function downloadJSON() {
  const state = useStore.getState();

  // Create a serializable version of the state.
  // The Zustand store might contain functions (actions, selectors).
  // We only want to serialize the data part (Model interface properties).
  const modelData = {
    floors: state.floors,
    walls: state.walls,
    trusses: state.trusses,
    settings: state.settings,
    // Add any other state properties that are part of the 'Model' definition
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
  console.log("JSON model downloaded.");
}

/**
 * Generates a 3D model from the current state and triggers an OBJ file download.
 */
export function exportOBJ() {
  // Get only the model data part of the state, not actions/selectors etc.
  const modelState = {
    floors: useStore.getState().floors,
    walls: useStore.getState().walls,
    trusses: useStore.getState().trusses,
    settings: useStore.getState().settings,
    // We need to ensure this object matches the 'Model' type expected by generateMesh
  };

  // generateMesh expects an object conforming to the Model type.
  // Ensure modelState correctly represents this.
  const group = generateMesh(modelState);

  const exporter = new OBJExporter();
  const objString = exporter.parse(group);

  const blob = new Blob([objString], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `model-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.obj`;
  document.body.appendChild(a); // Required for Firefox
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log("OBJ model exported.");
}
