import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ViewControls } from './view-controls';

describe('ViewControls', () => {
  test('toggles camera mode and visibility controls', () => {
    const onCameraModeChange = jest.fn();
    const onLevelDisplayModeChange = jest.fn();
    const onWallViewModeChange = jest.fn();
    const onGridVisibleChange = jest.fn();
    const onGuidesVisibleChange = jest.fn();
    const onMeasurementsVisibleChange = jest.fn();
    const onZoomToFit = jest.fn();
    const onResetCamera = jest.fn();

    render(
      <ViewControls
        cameraMode="perspective"
        levelDisplayMode="stacked"
        wallViewMode="full"
        gridVisible
        guidesVisible
        measurementsVisible
        onCameraModeChange={onCameraModeChange}
        onLevelDisplayModeChange={onLevelDisplayModeChange}
        onWallViewModeChange={onWallViewModeChange}
        onGridVisibleChange={onGridVisibleChange}
        onGuidesVisibleChange={onGuidesVisibleChange}
        onMeasurementsVisibleChange={onMeasurementsVisibleChange}
        onZoomToFit={onZoomToFit}
        onResetCamera={onResetCamera}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to Orthographic' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hide Grid' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hide Guides' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hide Measurements' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom to Fit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset Camera' }));

    expect(onCameraModeChange).toHaveBeenCalledWith('orthographic');
    expect(onGridVisibleChange).toHaveBeenCalledWith(false);
    expect(onGuidesVisibleChange).toHaveBeenCalledWith(false);
    expect(onMeasurementsVisibleChange).toHaveBeenCalledWith(false);
    expect(onZoomToFit).toHaveBeenCalledTimes(1);
    expect(onResetCamera).toHaveBeenCalledTimes(1);
    expect(onLevelDisplayModeChange).not.toHaveBeenCalled();
    expect(onWallViewModeChange).not.toHaveBeenCalled();
  });

  test('emits dropdown selections for level and wall view modes', () => {
    const onLevelDisplayModeChange = jest.fn();
    const onWallViewModeChange = jest.fn();

    render(
      <ViewControls
        cameraMode="orthographic"
        levelDisplayMode="stacked"
        wallViewMode="full"
        gridVisible
        guidesVisible={false}
        measurementsVisible={false}
        onCameraModeChange={jest.fn()}
        onLevelDisplayModeChange={onLevelDisplayModeChange}
        onWallViewModeChange={onWallViewModeChange}
        onGridVisibleChange={jest.fn()}
        onGuidesVisibleChange={jest.fn()}
        onMeasurementsVisibleChange={jest.fn()}
        onZoomToFit={jest.fn()}
        onResetCamera={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Level display mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exploded' }));

    fireEvent.click(screen.getByRole('button', { name: 'Wall view mode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Low Walls' }));

    expect(onLevelDisplayModeChange).toHaveBeenCalledWith('exploded');
    expect(onWallViewModeChange).toHaveBeenCalledWith('low');
  });
});
