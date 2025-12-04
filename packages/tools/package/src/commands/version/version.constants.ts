import type { CommandsConfig } from '@webex/cli-tools';

const CONFIG: CommandsConfig = {
  name: 'version',
  description: 'Set the version of the filtered packages',
  options: [
    {
      description: 'Version to set (e.g. 1.2.3 or 1.2.3-alpha.2)',
      name: 'set',
      type: 'string',
      required: true,
    },
    {
      description: 'Packages to target when setting the version',
      name: 'packages',
      type: 'string...',
    },
    {
      description: 'Apply to all workspace packages',
      name: 'all',
      type: 'boolean',
    },
  ],
};

const CONSTANTS = {
  CONFIG,
};

export default CONSTANTS;
