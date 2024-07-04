/**
 * Increment Command Options inteface.
 *
 * @public
 */
export interface Options {
  /**
   * Packages to increment
   *
   * @remarks
   * If no packages are defined, this will collect all workspace packages.
   */
  packages: Array<string>;

  /**
   * Tag to increment the version on.
   */
  tag: string;

  /**
   * Previous commit Id
   */
  commit: string;
}
