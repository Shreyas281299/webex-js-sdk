import path from 'path';

import type { CommandsCommand } from '@webex/cli-tools';

import { Package } from '../../models';
import { Yarn } from '../../utils';
import type { PackageConfig } from '../../models';

import CONSTANTS from './version.constants';
import type { Options } from './version.types';

/**
 * The version Command configuration Object. This Command is used to set
 * versions across packages based on the provided CLI Options.
 *
 * @public
 */
const version: CommandsCommand<Options> = {
  /**
   * Configuration Object for this version Command configuration.
   */
  config: CONSTANTS.CONFIG,

  /**
   * Handles setting package versions based on the provided Options.
   *
   * @param options - Options provided from the CLI interface.
   * @returns - Promise that resolves once the process is complete.
   */
  handler: async (options: Options) => {
    const rootDir = process.cwd();
    const inputVersion = options.set;

    if (!options.all && (!options.packages || options.packages.length === 0)) {
      throw new Error('No target packages provided. Use --packages <names...> or --all.');
    }

    const targetVersion = Package.parseVersionStringToObject(inputVersion);

    const packageDetails = await Yarn.list();
    const packs = packageDetails
      .map(
        ({ location, name }: PackageConfig) => new Package({
          location: path.join(rootDir, location),
          name,
          tag: targetVersion.tag,
        }),
      )
      .filter((pack: Package) => (options.packages ? options.packages.includes(pack.name) : true));

    // If specific packages not provided and --all not set, guard again
    if (!options.all && (!options.packages || options.packages.length === 0)) {
      throw new Error('Use --all to apply to all packages or provide --packages.');
    }

    packs.forEach((pack: Package) => pack.setVersion(targetVersion));

    const output = packs.map((pack: Package) => `${pack.name} => ${pack.version}`).join('\n');
    process.stdout.write(output);

    await Promise.all(packs.map((pack: Package) => pack.apply()));
  },
};

export default version;
