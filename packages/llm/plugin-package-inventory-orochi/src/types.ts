/** Wire types for the active Orochi plugin package inventory. */

/** One exact active plugin package version. */
export interface OrochiPluginPackageIdentity {
  readonly name: string
  readonly version: string
}

/** Versioned full package inventory carried by each official Orochi request. */
export interface OrochiPluginPackageInventoryExtension {
  readonly version: 1
  readonly packages: readonly OrochiPluginPackageIdentity[]
}

declare module '@orochi-network/oh-orochi-llm-api-extensions/types' {
  interface OrochiLlmApiExtensionMap {
    oh_plugin_packages: OrochiPluginPackageInventoryExtension
  }
}
