/*
 * Bundled preset registry for wizard imports.
 * Keep metadata here and move larger preset payloads into sibling modules.
 */

import { UAV_DESCRIPTION } from '../../utils/const';
import uav301SourceJson from './uav301Preset';
import uav302SourceJson from './uav302Preset';
import uav303SourceJson from './uav303Preset';

export const CONFIG_PRESET_REGISTRY = [
  {
    id: 'uav-301-preset',
    displayName: UAV_DESCRIPTION['UAV-301'].title,
    description: UAV_DESCRIPTION['UAV-301'].text,
    sourceJson: uav301SourceJson,
  },
  {
    id: 'uav-302-preset',
    displayName: UAV_DESCRIPTION['UAV-302'].title,
    description: UAV_DESCRIPTION['UAV-302'].text,
    sourceJson: uav302SourceJson,
  },
  {
    id: 'uav-303-preset',
    displayName: UAV_DESCRIPTION['UAV-303'].title,
    description: UAV_DESCRIPTION['UAV-303'].text,
    sourceJson: uav303SourceJson,
  },
];
