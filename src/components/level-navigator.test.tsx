import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LevelNavigator } from './level-navigator';

const LEVELS = [
  { id: 'level-0', name: 'Ground Floor', elevation: 0 },
  { id: 'level-1', name: 'Level 2', elevation: 10 },
  { id: 'level-2', name: 'Roof Deck', elevation: 20 },
];

describe('LevelNavigator', () => {
  test('shows the current level and disables out-of-bounds navigation', () => {
    render(
      <LevelNavigator
        levels={LEVELS}
        currentLevelIndex={0}
        onLevelChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Ground Floor')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByTitle('Previous level (Cmd+Down)')).toBeDisabled();
    expect(screen.getByTitle('Next level (Cmd+Up)')).not.toBeDisabled();
  });

  test('clicking controls emits the requested target level', () => {
    const onLevelChange = jest.fn();

    render(
      <LevelNavigator
        levels={LEVELS}
        currentLevelIndex={1}
        onLevelChange={onLevelChange}
      />,
    );

    fireEvent.click(screen.getByTitle('Previous level (Cmd+Down)'));
    fireEvent.click(screen.getByTitle('Next level (Cmd+Up)'));
    fireEvent.click(screen.getByTitle('Roof Deck'));

    expect(onLevelChange).toHaveBeenNthCalledWith(1, 0);
    expect(onLevelChange).toHaveBeenNthCalledWith(2, 2);
    expect(onLevelChange).toHaveBeenNthCalledWith(3, 2);
  });

  test('keyboard shortcuts mirror the button navigation', () => {
    const onLevelChange = jest.fn();

    render(
      <LevelNavigator
        levels={LEVELS}
        currentLevelIndex={1}
        onLevelChange={onLevelChange}
      />,
    );

    fireEvent.keyDown(window, { metaKey: true, key: 'ArrowUp' });
    fireEvent.keyDown(window, { ctrlKey: true, key: 'ArrowDown' });

    expect(onLevelChange).toHaveBeenNthCalledWith(1, 2);
    expect(onLevelChange).toHaveBeenNthCalledWith(2, 0);
  });
});
