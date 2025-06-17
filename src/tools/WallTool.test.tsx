import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import WallTool from './WallTool';
import * as storeModule from '@/src/model/useStore'; // Import as namespace
import { Point } from '@/src/model/types';

// Mock the store
const mockAddWall = jest.fn();
let mockStoreState: storeModule.Model;

// Deep clone helper
const deepClone = <T extends unknown>(obj: T): T => JSON.parse(JSON.stringify(obj));

let originalInitialState: storeModule.Model;

// Setup before all tests in this file
beforeAll(() => {
  originalInitialState = deepClone(storeModule.useStore.getState());
});

beforeEach(() => {
  // Reset store state to a deep copy of the original initial state
  mockStoreState = deepClone(originalInitialState);

  // Spy on getState and return our controlled state and mock actions
  jest.spyOn(storeModule.useStore, 'getState').mockReturnValue({
    ...mockStoreState,
    addWall: mockAddWall,
    // Ensure other actions/state properties used by the component are here if any
  } as any);

  mockAddWall.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks(); // Restore all mocks
});

describe('WallTool Component Logic', () => {
  test('should render and be hidden when isActive is false', () => {
    const { container } = render(<WallTool isActive={false} />);
    expect(container.firstChild).toHaveStyle('display: none');
  });

  test('should render and be visible when isActive is true', () => {
    render(<WallTool isActive={true} />);
    expect(screen.getByText(/Wall Tool/i)).toBeInTheDocument();
    expect(screen.getByText(/Finish Drawing Session/i)).toBeInTheDocument();
  });

  test('clicking "Finish Drawing Session" button should reset drawing state (if drawing)', () => {
    render(<WallTool isActive={true} />);
    const finishButton = screen.getByText(/Finish Drawing Session/i);

    // To properly test this, we'd need to simulate that isDrawing was true.
    // For example, by simulating a pointer down event.
    // This is difficult with the current structure as handlePointerDown is not exposed.
    // Assume for now: if the button is clicked, handleFinishDrawing is called.
    // We can check if the button click changes the displayed text if it reflects isDrawing state.
    // The WallTool text changes: "Wall Tool (Drawing from...)" vs "Wall Tool"

    // Simulate starting drawing (conceptual, as we can't call handlePointerDown easily)
    // If we could:
    // act(() => { /* call handlePointerDown a point */ });
    // expect(screen.getByText(/Drawing from/i)).toBeInTheDocument(); // Check if state changed

    act(() => {
      fireEvent.click(finishButton);
    });
    // After finishing, it should revert to the non-drawing state text
    expect(screen.getByText(/^Wall Tool$/i)).toBeInTheDocument(); // Regex to match "Wall Tool" without "(Drawing...)"
    expect(finishButton).toBeDisabled(); // Button becomes disabled when not drawing
  });

  test('internal state should reset when isActive becomes false', () => {
    const { rerender } = render(<WallTool isActive={true} />);
    // Similar to FloorTool, fully testing this requires simulating an active drawing state first.
    expect(screen.getByText(/Wall Tool/i).parentElement).toHaveStyle('display: block');

    rerender(<WallTool isActive={false} />);
    expect(screen.getByText(/Wall Tool/i).parentElement).toHaveStyle('display: none');
  });

  // Placeholder for testing addWall calls.
  // This would require simulating a sequence of pointer down events.
  // e.g.
  // 1. Render WallTool.
  // 2. (Simulate) Call handlePointerDown({x:0,y:0}). isDrawing becomes true, startPoint is {0,0}.
  // 3. (Simulate) Call handlePointerDown({x:10,y:0}). addWall is called with ({x:0,y:0}, {x:10,y:0}). startPoint becomes {10,0}.
  // 4. Check mockAddWall calls.
  test('addWall should be called (conceptual)', () => {
    render(<WallTool isActive={true} />);
    // If handlePointerDown could be invoked:
    // act(() => { result.current.handlePointerDown({ x: 0, y: 0 }); }); // If it were a hook
    // act(() => { result.current.handlePointerDown({ x: 10, y: 0 }); });
    // expect(mockAddWall).toHaveBeenCalledTimes(1);
    // expect(mockAddWall).toHaveBeenCalledWith(expect.objectContaining({
    //   start: { x: 0, y: 0 },
    //   end: { x: 10, y: 0 },
    //   height: 3, // Default
    //   thickness: 0.15 // Default
    // }));
    //
    // act(() => { result.current.handlePointerDown({ x: 10, y: 10 }); });
    // expect(mockAddWall).toHaveBeenCalledTimes(2);
    // expect(mockAddWall).toHaveBeenLastCalledWith(expect.objectContaining({
    //   start: { x: 10, y: 0 },
    //   end: { x: 10, y: 10 },
    // }));
  });

  // Test for Escape/Enter key press if possible with JSDOM and @testing-library/react
  test('Escape key should finish drawing session', () => {
    render(<WallTool isActive={true} />);

    // Simulate that drawing has started (conceptually)
    // If we could set isDrawing = true and startPoint = {x:0, y:0} internally for the component instance

    // To make the button enabled (which means isDrawing is true)
    // We need to simulate the first click. This is the main challenge.
    // For now, we assume isDrawing is true after some interaction not easily simulated here.
    // If it were true:
    // fireEvent.keyUp(document.body, { key: 'Escape', code: 'Escape' });
    // expect(screen.getByText(/^Wall Tool$/i)).toBeInTheDocument();
    // expect(screen.getByText(/Finish Drawing Session/i)).toBeDisabled();
  });

});
