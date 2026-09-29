/** Desktop build version passed to the Host as `OH_CLIENT_VERSION`. */

/**
 * Read the client build version inlined by the Desktop build.
 * @returns the version embedded in this application build.
 * @throws Error when the build carries no client version, instead of reporting a guessed one.
 */
export function desktopClientVersion(): string {
  const version = process.env.OH_CLIENT_VERSION
  if (version === undefined || version === '') {
    throw new Error('desktop: this application build carries no OH_CLIENT_VERSION')
  }
  return version
}
