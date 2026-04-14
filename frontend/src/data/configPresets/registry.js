/*
 * Bundled preset registry for wizard imports.
 * Keep metadata here and move larger preset payloads into sibling modules.
 */

import uav301SourceJson from './uav301Preset';
import uav302SourceJson from './uav302Preset';
import uav303SourceJson from './uav303Preset';

export const CONFIG_PRESET_REGISTRY = [
  {
    id: 'uav-301-preset',
    displayName: 'Circle & Square — O\'Hare, Chicago',
    description: 'Two drones flying a circle and square pattern near O\'Hare Airport, Chicago. Tests UAV-301 drift tolerance (10m) in windy conditions.',
    sourceJson: uav301SourceJson,
  },
  {
    id: 'uav-302-preset',
    displayName: 'Coordinated Flight — Naperville, IL',
    description: 'Two drones flying coordinated missions near Naperville, IL, maintaining 5m minimum separation. Tests UAV-302 coordination requirements.',
    sourceJson: uav302SourceJson,
  },
  {
    id: 'uav-303-preset',
    displayName: 'Path Accuracy — Lincoln, NE',
    description: 'Two drones flying with strict path accuracy near Lincoln, NE. Tests UAV-303 drift tolerance (15m) using fuzzy wind testing.',
    sourceJson: uav303SourceJson,
  },
];
