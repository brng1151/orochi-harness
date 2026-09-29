import { Context } from '@orochi-network/cordis'
import { SettingsSchemaService } from '@orochi-network/oh-client-ui-settings/src/client/schema.ts'
import { createSettingsSchemaOperations } from '../src/client/schema-operations.ts'

/** Stateless schema operations used by settings-model component fixtures. */
export const settingsSchema = createSettingsSchemaOperations(new SettingsSchemaService(new Context()))
