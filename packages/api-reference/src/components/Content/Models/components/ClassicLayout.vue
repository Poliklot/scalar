<script setup lang="ts">
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { resolve } from '@scalar/workspace-store/resolve'
import type {
  OpenApiDocument,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Anchor } from '@/components/Anchor'
import { SectionAccordion, SectionHeaderTag } from '@/components/Section'

import { SchemaHeading, SchemaProperty } from '../../Schema'

const { eventBus, id, options, document, schema } = defineProps<{
  id: string
  name: string
  schema: SchemaObject
  isCollapsed: boolean
  eventBus: WorkspaceEventBus
  /** The document the model belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'hideModels'
  >
}>()

/**
 * The schema this model renders.
 *
 * A resource that extends a template through a root `$ref` (a `$ref` alongside sibling keywords like
 * `$defs`, e.g. a `PaginatedResponse` binding) keeps its properties behind the reference, so merge
 * it to list the inherited fields instead of rendering a bare reference. A no-op for ordinary
 * schemas. Mirrors the root `$ref` merge in `Schema.vue` used by the modern layout.
 */
const resolvedSchema = computed(
  (): SchemaObject => ('$ref' in schema ? resolve.schema(schema) : schema),
)
</script>
<template>
  <SectionAccordion
    :aria-label="resolvedSchema.title ?? name"
    :modelValue="!isCollapsed"
    @update:modelValue="
      (value) => eventBus?.emit('toggle:nav-item', { id, open: value })
    ">
    <template #title>
      <Anchor
        class="reference-models-anchor"
        :eventBus="eventBus"
        @copyAnchorUrl="() => eventBus?.emit('copy-url:nav-item', { id })">
        <SectionHeaderTag :level="3">
          <SchemaHeading
            class="reference-models-label"
            :name="resolvedSchema.title ?? name"
            :value="resolvedSchema" />
        </SectionHeaderTag>
      </Anchor>
    </template>
    <!-- Schema -->
    <div
      v-if="'properties' in resolvedSchema"
      class="properties">
      <SchemaProperty
        v-for="[property, value] in Object.entries(
          resolvedSchema.properties ?? {},
        )"
        :key="property"
        :eventBus="eventBus"
        :hideModelNames="options.hideModels"
        :name="property"
        :options="{ ...options, document }"
        :required="resolvedSchema.required?.includes(property)"
        :schema="resolve.schema(value)" />
    </div>
    <div v-else>
      <SchemaProperty
        :eventBus="eventBus"
        :hideModelNames="options.hideModels"
        :options="{ ...options, document }"
        :schema="resolvedSchema" />
    </div>
  </SectionAccordion>
</template>
<style scoped>
.reference-models-anchor {
  display: flex;
  align-items: center;
  font-size: 20px;
  padding-left: 6px;
  color: var(--scalar-color-1);
}
.reference-models-label {
  display: block;
  font-size: var(--scalar-mini);
}

/* Style the "icon" */
.reference-models-label :deep(em) {
  font-weight: var(--scalar-bold);
}
</style>
