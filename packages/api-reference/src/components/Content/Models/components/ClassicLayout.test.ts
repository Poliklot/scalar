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
})
