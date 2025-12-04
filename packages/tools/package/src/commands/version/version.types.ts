/**
 * Version Command Options interface.
 *
 * @public
 */
export interface Options {
  /**
   * Version string to set (e.g., 1.2.3 or 1.2.3-alpha.2).
   */
  set: string;

  /**
   * Packages to target.
   *
   * If omitted, --all must be provided.
   */
  packages?: Array<string>;

  /**
   * Apply to all workspace packages.
   */
  all?: boolean;
}
