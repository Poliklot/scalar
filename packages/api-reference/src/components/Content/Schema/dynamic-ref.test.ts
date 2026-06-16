import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Schema from './Schema.vue'

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
  } as unknown as Parameters<typeof mountSchema>[0]
}

const mountSchema = (schema: unknown) =>
  mount(Schema, {
    props: {
      // Expanding everything lets us assert on nested item properties without driving disclosures.
      options: { expandAllSchemaProperties: true },
      eventBus: null,
      schema: schema as never,
      level: 1,
      noncollapsible: true,
    } as never,
  })

/**
 * The names of every property the schema tree renders, in document order.
 *
 * Asserting on this list (rather than substring-matching the flattened text) keeps the checks precise:
 * a generic word like `id` in some label cannot make an assertion pass by accident.
 */
const propertyNames = (wrapper: ReturnType<typeof mountSchema>) =>
  wrapper.findAll('.property-name').map((node) => node.text())

describe('Schema $dynamicRef rendering', () => {
  it('renders a template resource by showing its inherited properties', () => {
    const names = propertyNames(
      mountSchema(buildPaginatedResource({ type: 'object', properties: { id: { type: 'string' } } })),
    )
    expect(names).toEqual(expect.arrayContaining(['items', 'total']))
  })

  it('binds the dynamic array item type to the concrete bound schema', () => {
    const user = {
      type: 'object',
      required: ['id', 'email'],
      properties: { id: { type: 'string' }, email: { type: 'string', format: 'email' } },
    }

    const names = propertyNames(mountSchema(buildPaginatedResource(user)))

    // The shared `items: { $dynamicRef: '#itemType' }` slot renders the bound `User` shape (`id`,
    // `email`) alongside the template's own `items` and `total`, with no other binding's fields.
    expect(names).toEqual(expect.arrayContaining(['items', 'total', 'id', 'email']))
    expect(names).not.toContain('groupName')
  })

  it('resolves the same template to different item types per binding', () => {
    const names = propertyNames(
      mountSchema(buildPaginatedResource({ type: 'object', properties: { groupName: { type: 'string' } } })),
    )

    // The `Group` binding shows `groupName`, never the `User` binding's `email`.
    expect(names).toContain('groupName')
    expect(names).not.toContain('email')
  })

  it('leaves an unresolved $dynamicRef array empty without crashing', () => {
    // Rendering the bare template (no binding in scope) keeps prior behavior: the item type is unbound,
    // so only the template's own `items` property renders and nothing from an item shape leaks in.
    const template = {
      $id: 'https://example.com/schemas/PaginatedTemplate',
      $defs: { itemType: { $dynamicAnchor: 'itemType', not: {} } },
      type: 'object',
      properties: { items: { type: 'array', items: { $dynamicRef: '#itemType' } } },
    }
    expect(propertyNames(mountSchema(template))).toEqual(['items'])
  })

  it('bounds a recursive $dynamicRef instead of expanding it forever', () => {
    // Classic self-referential tree: the resource is its own `$dynamicAnchor` and its `children`
    // items point back to it via `$dynamicRef`. The binding resolves to the node itself, so without a
    // stop the tree would expand without end. Cycle detection keyed on the raw `$dynamicRef` item lets
    // the node bind at least one nested level, then halts.
    const tree = {
      $id: 'https://example.com/schemas/Tree',
      $dynamicAnchor: 'node',
      type: 'object',
      required: ['data'],
      properties: {
        data: { type: 'string' },
        children: { type: 'array', items: { $dynamicRef: '#node' } },
      },
    }

    const names = propertyNames(mountSchema(tree))

    // The node renders, the recursive binding expands at least once (more than the two top-level
    // properties), and the depth stays bounded — no runaway expansion. The exact depth is an
    // implementation detail of cycle detection, so we assert the invariant, not a fixed count.
    expect(names).toContain('data')
    expect(names).toContain('children')
    expect(names.length).toBeGreaterThan(2)
    expect(names.length).toBeLessThan(12)
  })

  it('bounds a recursive $dynamicRef on a direct property', () => {
    // The same termination guarantee must hold when the `$dynamicRef` sits directly on a property
    // (a linked-list `next`) rather than on array items, since that is a separate render path.
    const node = {
      $id: 'https://example.com/schemas/Node',
      $dynamicAnchor: 'node',
      type: 'object',
      required: ['value'],
      properties: {
        value: { type: 'string' },
        next: { $dynamicRef: '#node' },
      },
    }

    const names = propertyNames(mountSchema(node))

    expect(names).toContain('value')
    expect(names).toContain('next')
    expect(names.length).toBeGreaterThan(2)
    expect(names.length).toBeLessThan(12)
  })

  it('merges sibling annotations onto a root $ref resource', () => {
    // Template binding relies on a root `$ref` keeping its siblings; this guards the shared merge path
    // directly. An OpenAPI 3.1 model may carry annotations beside a root `$ref`, and those siblings win
    // over the referenced target while the target's properties still render.
    const model = {
      $ref: '#/components/schemas/Base',
      '$ref-value': {
        type: 'object',
        description: 'base description',
        properties: { id: { type: 'string' } },
      },
      description: 'sibling description wins',
    } as unknown as Parameters<typeof mountSchema>[0]

    const wrapper = mountSchema(model)

    expect(propertyNames(wrapper)).toEqual(['id'])
    expect(wrapper.text()).toContain('sibling description wins')
    expect(wrapper.text()).not.toContain('base description')
  })
})
