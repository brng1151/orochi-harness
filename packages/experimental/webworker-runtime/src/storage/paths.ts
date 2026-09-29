/**
 * Virtual root of the worker host's in-memory filesystem. Kept
 * in one module so the process shim, the path/os shims, and the VFS image
 * collector cannot drift apart.
 */

/** Virtual filesystem root; `process.cwd()` and every absolute path start here. */
export const OH_ROOT = '/oh'

/** `$OH_HOME`: durable-state directory inside the image. */
export const OH_HOME = `${OH_ROOT}/home`

/** Flat, symlink-free package tree resolved by the worker module loader. */
export const OH_NODE_MODULES = `${OH_ROOT}/node_modules`

/** Directory holding the composed cordis.yml. */
export const OH_CONFIG = `${OH_ROOT}/config`

/** Default (empty) workspace directory. */
export const OH_WORKSPACE = `${OH_ROOT}/workspace`

/** Temporary directory reported by `os.tmpdir()`. */
export const OH_TMP = `${OH_ROOT}/tmp`
