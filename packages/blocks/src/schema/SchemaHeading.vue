<script lang="ts" setup>
import { ScalarWrappingText } from '@scalar/components/wrapping-text'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'
import { computed } from 'vue'

import { isTypeObject } from './helpers/is-type-object'
import { getSchemaTranslate, type SchemaTranslationKey } from './translations'
import type { SchemaOptions } from './types'

const props = defineProps<{
  value: SchemaObject
  name?: string
  options?: SchemaOptions
}>()

const translate = (key: SchemaTranslationKey): string =>
  getSchemaTranslate(props.options?.translate)(key)

/** Generate a failsafe type from the properties when we don't have one */
const failsafeType = computed(() => {
  if ('type' in props.value) {
    return props.value.type
  }

  if (props.value.enum) {
    return 'enum'
  }

  if (isArraySchema(props.value) && props.value.items) {
    return 'array'
  }

  if (
    isTypeObject(props.value) &&
    (props.value.properties || props.value.additionalProperties)
  ) {
    return 'object'
  }

  return 'unknown'
})
</script>

<template>
  <span
    v-if="typeof props.value === 'object'"
    class="schema-type">
    <span
      class="schema-type-icon"
      :title="
        'type' in props.value && typeof props.value.type === 'string'
          ? props.value.type
          : 'type' in props.value && Array.isArray(props.value.type)
            ? props.value.type.join(' | ')
            : translate('schema.unknownType')
      ">
      <template v-if="isTypeObject(props.value)"> {} </template>
      <template v-if="isArraySchema(props.value)"> [] </template>
      <template v-if="props.value.enum"> enum </template>
    </span>
    <template v-if="props.name">
      <ScalarWrappingText
        preset="property"
        :text="props.name" />
    </template>
    <template v-else>
      {{ failsafeType }}
    </template>
  </span>
</template>
<style scoped>
/* Style the "icon" */
.schema-type-icon {
  color: var(--scalar-color-1);
  display: none;
}
.schema-type {
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
}
</style>
