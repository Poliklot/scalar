<script setup lang="ts">
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  pushDynamicScope,
  resolveDynamicSchema,
} from '@scalar/workspace-store/helpers/dynamic-ref'
import { resolve } from '@scalar/workspace-store/resolve'
import type {
  OpenApiDocument,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, provide } from 'vue'

import { Anchor } from '@/components/Anchor'
import {
  SCHEMA_DYNAMIC_SCOPE_SYMBOL,
  useDynamicScope,
} from '@/components/Content/Schema/helpers/dynamic-scope'
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
 * The dynamic scope inherited from ancestor schema resources (empty for a top-level model). Used to
 * bind a top-level `$dynamicRef` and to seed the scope re-provided to descendants. See
 * {@link useDynamicScope}.
 */
const dynamicScope = useDynamicScope()

/**
 * This model's schema with a top-level `$dynamicRef` bound to its concrete type (a no-op for ordinary
 * schemas). Shared by the rendered schema and the scope re-provided below, mirroring `Schema.vue`.
 */
const boundSchema = computed(
  (): SchemaObject => resolveDynamicSchema(schema, dynamicScope),
)

/**
 * The schema this model renders.
 *
 * A resource that extends a template through a root `$ref` (a `$ref` alongside sibling keywords like
 * `$defs`, e.g. a `PaginatedResponse` binding) keeps its properties behind the reference, so merge
 * it to list the inherited fields instead of rendering a bare reference. A no-op for ordinary
 * schemas. Mirrors the root `$ref` merge in `Schema.vue` used by the modern layout.
 */
const resolvedSchema = computed((): SchemaObject => {
  const bound = boundSchema.value
  return '$ref' in bound ? resolve.schema(bound) : bound
})

/**
 * Re-provide the dynamic scope grown with this model's resource so its nested `$dynamicRef`s (e.g. a
 * `PaginatedResponse.items` array bound to `User`) resolve, matching the modern layout. The classic
 * layout renders properties through `SchemaProperty` directly rather than `Schema.vue`, so without
 * this the binding `$id` / `$defs` would never enter the scope and the items would stay unbound.
 *
 * The raw bound schema is pushed, not the merged {@link resolvedSchema}: merging through
 * `resolve.schema` drops the resolved `$ref-value` from `$defs` entries that `$dynamicAnchor`
 * resolution relies on to dereference the bound type.
 */
provide(
  SCHEMA_DYNAMIC_SCOPE_SYMBOL,
  pushDynamicScope(dynamicScope, boundSchema.value),
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
