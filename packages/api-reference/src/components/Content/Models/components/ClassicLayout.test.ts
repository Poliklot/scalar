import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ClassicLayout from './ClassicLayout.vue'

const mountModel = (schema: unknown) =>
  mount(ClassicLayout, {
    props: {
      id: 'model',
      name: 'PaginatedResponse',
      schema: schema as never,
      isCollapsed: false,
      eventBus: null,
      options: { expandAllSchemaProperties: true },
    } as never,
  })

const propertyNames = (wrapper: ReturnType<typeof mountModel>) =>
  wrapper.findAll('.property-name').map((node) => node.text())

/**
 * Builds a `PaginatedResponse<T>`-style resource as the workspace store represents it: a named schema
 * that extends a shared template through a root `$ref`, binding the template's `$dynamicRef` item type
 * via a sibling `$defs.itemType`. The `$ref`/`$ref-value` pairs mirror the store's resolved magic proxy.
 */
const buildPaginatedResource = (item: Record<string, unknown>) => {
  const template = {
    $id: 'https://example.com/schemas/PaginatedTemplate',
    $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } },
    type: 'object',
    required: ['items', 'total'],
    properties: {
      items: { type: 'array', items: { $dynamicRef: '#itemType' } },
      total: { type: 'integer' },
    },
  }

  return {
    $id: 'https://example.com/schemas/PaginatedResponse',
    $defs: {
      itemType: { $dynamicAnchor: 'itemType', $ref: '#/components/schemas/Item', '$ref-value': item },
    },
    $ref: '#/components/schemas/PaginatedTemplate',
    '$ref-value': template,
  }
}

describe('ClassicLayout', () => {
  it('lists the inherited properties of a root $ref model', () => {
    // A model whose body lives behind a root `$ref` (e.g. a `PaginatedResponse` template binding) has
    // no own `properties` key. The classic layout must merge the reference so its fields render, rather
    // than falling back to a single bare-reference property. The `$ref`/`$ref-value` pair mirrors the
    // store's resolved magic proxy.
    const model = {
      $ref: '#/components/schemas/PaginatedTemplate',
      '$ref-value': {
        type: 'object',
        required: ['items', 'total'],
        properties: {
          items: { type: 'array', items: { type: 'string' } },
          total: { type: 'integer' },
        },
      },
    }

    expect(propertyNames(mountModel(model))).toEqual(expect.arrayContaining(['items', 'total']))
  })

  it('renders an ordinary object model unchanged', () => {
    const model = {
      type: 'object',
      properties: { id: { type: 'string' }, email: { type: 'string' } },
    }

    expect(propertyNames(mountModel(model))).toEqual(expect.arrayContaining(['id', 'email']))
  })

  it('binds a $dynamicRef array item to the concrete bound type', () => {
    // The classic layout renders properties through `SchemaProperty` directly, so it must re-provide the
    // dynamic scope grown with the binding resource for the `items: { $dynamicRef: '#itemType' }` slot to
    // resolve. The `User` binding renders `id` and `email` alongside the template's `items` and `total`.
    const user = {
      type: 'object',
      required: ['id', 'email'],
      properties: { id: { type: 'string' }, email: { type: 'string', format: 'email' } },
    }

    const names = propertyNames(mountModel(buildPaginatedResource(user)))

    expect(names).toEqual(expect.arrayContaining(['items', 'total', 'id', 'email']))
    expect(names).not.toContain('groupName')
  })

  it('resolves the same template to different item types per binding', () => {
    const names = propertyNames(
      mountModel(buildPaginatedResource({ type: 'object', properties: { groupName: { type: 'string' } } })),
    )

    // The `Group` binding shows `groupName`, never the `User` binding's `email`.
    expect(names).toContain('groupName')
    expect(names).not.toContain('email')
  })
})
