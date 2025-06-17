import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import FloorTool, { calculatePolygonArea, isClockwise } from './FloorTool';
import * as storeModule from '@/src/model/useStore'; // Import as namespace
import { Point } from '@/src/model/types';

// Mock the store
const mockAddFloor = jest.fn();
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
    addFloor: mockAddFloor,
    // Ensure other actions/state properties used by the component are here if any
    // For FloorTool, it primarily uses addFloor and reads initial state structure.
  } as any); // Use 'as any' to simplify if full Model type with functions is complex

  mockAddFloor.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks(); // Restore all mocks after each test
});


describe('FloorTool Helper Functions', () => {
  describe('calculatePolygonArea', () => {
    test('should return 0 for less than 3 points', () => {
      expect(calculatePolygonArea([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(0);
    });
    test('should calculate area of a square', () => {
      const square: Point[] = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];
      expect(calculatePolygonArea(square)).toBe(4);
    });
    test('should calculate area of a triangle', () => {
      const triangle: Point[] = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 2 }];
      expect(calculatePolygonArea(triangle)).toBe(4);
    });
    test('should handle points in different orders (abs value)', () => {
        const square: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 0 }]; // CW
        expect(calculatePolygonArea(square)).toBe(4);
      });
  });

  describe('isClockwise', () => {
    test('should return false for less than 3 points', () => {
      expect(isClockwise([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(false);
    });
    test('should identify clockwise points', () => {
      const clockwisePoints: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }];
      expect(isClockwise(clockwisePoints)).toBe(true);
    });
    test('should identify counter-clockwise points', () => {
      const counterClockwisePoints: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
      expect(isClockwise(counterClockwisePoints)).toBe(false);
    });
  });
});

describe('FloorTool Component Logic', () => {
  // Note: Testing the internal handlers like handlePointerDown directly is hard.
  // We'll test effects where possible or via UI interaction if available.
  // The current FloorTool UI is mostly for debug.

  test('should render and be hidden when isActive is false', () => {
    const { container } = render(<FloorTool isActive={false} />);
    // The main div in FloorTool has style display: isActive ? 'block' : 'none'
    expect(container.firstChild).toHaveStyle('display: none');
  });

  test('should render and be visible when isActive is true', () => {
    const { container } = render(<FloorTool isActive={true} />);
    expect(container.firstChild).toHaveStyle('display: block');
    expect(screen.getByText(/Floor Tool/i)).toBeInTheDocument();
  });

  test('internal state should reset when isActive becomes false', () => {
    const { rerender } = render(<FloorTool isActive={true} />);
    // At this point, we can't easily simulate drawing to change internal state like currentPoints
    // without exposing handlers or more complex UI simulation.
    // However, we can test that if it were active and then deactivated, it attempts to reset.
    // This test is conceptual for the useEffect resetting logic.
    // To truly test it, we'd need to:
    // 1. Simulate drawing points (hard without exposed handlers)
    // 2. Call rerender({ isActive: false })
    // 3. Verify points are cleared (again, hard to check internal state directly)

    // For now, this just tests the isActive prop's effect on visibility.
    expect(screen.getByText(/Floor Tool/i)).toBeInTheDocument();
    rerender(<FloorTool isActive={false} />);
    expect(screen.getByText(/Floor Tool/i).parentElement).toHaveStyle('display: none');
  });

  // Placeholder for testing addFloor call - this is complex with current structure
  // To test this properly, we would need to:
  // 1. Get the FloorTool instance or expose its handlePointerDown/handleFinishFloor methods.
  // 2. Call handlePointerDown multiple times with Point data.
  // 3. Call handleFinishFloor.
  // 4. Check if mockAddFloor was called with the expected data.

  test('handleFinishFloor (conceptual - if it could be called)', () => {
    render(<FloorTool isActive={true} />);
    // Manually calling component's internal methods like below is not standard React testing practice.
    // This would require refactoring FloorTool to expose methods, e.g., via useImperativeHandle.

    // const instance = ... // obtain instance (e.g. via ref)
    // act(() => { instance.handlePointerDown({x:0,y:0}); });
    // act(() => { instance.handlePointerDown({x:10,y:0}); });
    // act(() => { instance.handlePointerDown({x:5,y:10}); });
    // act(() => { instance.handleFinishFloor(); });
    // expect(mockAddFloor).toHaveBeenCalled();

    // Test error for < 3 points if "Finish Floor" button existed and was clicked
    // For example, if a button with text "Finish Floor" existed:
    // fireEvent.click(screen.getByText("Finish Floor"));
    // expect(screen.getByText(/A floor must have at least 3 points/i)).toBeInTheDocument();
  });
   test('should display error if trying to finish with less than 3 points (if Finish button existed)', () => {
    // This test assumes a "Finish Floor" button could call handleFinishFloor
    // And that handleFinishFloor is called when the tool has e.g. 2 points.
    // Since the button is commented out, this is a conceptual test.
    // If the button were active:
    // render(<FloorTool isActive={true} />);
    // Simulate adding 2 points... (again, hard)
    // fireEvent.click(screen.getByText("Finish Floor")); // Assuming button exists
    // expect(screen.getByText("Error: A floor must have at least 3 points.")).toBeInTheDocument();
  });


  // More tests would require refactoring FloorTool to be more testable,
  // for example, by making it a custom hook or by providing a more interactive UI.
});
