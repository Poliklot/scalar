import {
  type Schema,
  any,
  array,
  boolean,
  intersection,
  lazy,
  literal,
  number,
  object,
  optional,
  record,
  string,
  union,
} from '@scalar/validation'

import { XInternal, XScalarIgnore, XTags } from '@/extensions/document'
import { XAdditionalPropertiesName, XEnumDescriptions, XEnumVarNames, XExamples, XVariable } from '@/extensions/schema'
import { discriminatorObject } from '@/openapi/3.1/discriminator'
import { externalDocs } from '@/openapi/3.1/external-docs'
import { normalRef } from '@/openapi/3.1/reference'
import { xml } from '@/openapi/3.1/xml'

const schemaExtensionObjects = [
  XScalarIgnore,
  XInternal,
  XVariable,
  XExamples,
  XEnumDescriptions,
  XEnumVarNames,
  XAdditionalPropertiesName,
  XTags,
] as const

const coreSchemaProperties = object({
  name: optional(string({ typeComment: 'Schema name (extension).' })),
  // JSON Schema 2020-12 core reference keywords. OpenAPI 3.1 Schema Objects may carry these for
  // generic and recursive patterns such as `PaginatedResponse<T>`; keep them typed so coercion
  // does not drop them. Resolution of `$dynamicRef` against the active `$dynamicAnchor` happens
  // separately, see https://github.com/scalar/scalar/issues/9414. Mirrors the workspace-store
  // Schema Object definition.
  $id: optional(string({ typeComment: 'JSON Schema 2020-12 schema identifier.' })),
  $anchor: optional(string({ typeComment: 'JSON Schema 2020-12 plain-name anchor.' })),
  $dynamicAnchor: optional(
    string({ typeComment: 'JSON Schema 2020-12 dynamic anchor; the target a matching `$dynamicRef` resolves to.' }),
  ),
  $dynamicRef: optional(
    string({ typeComment: 'JSON Schema 2020-12 dynamic reference, resolved against the active `$dynamicAnchor`.' }),
  ),
  title: optional(string({ typeComment: 'A title for the schema.' })),
  description: optional(string({ typeComment: 'A description of the schema.' })),
  default: optional(any({ typeComment: 'Default value for the schema.' })),
  enum: optional(array(any(), { typeComment: 'Array of allowed values.', typeName: 'JsonSchemaEnum' })),
  const: optional(any({ typeComment: 'Constant value that must match exactly.' })),
  contentMediaType: optional(string({ typeComment: 'Media type for content validation.' })),
  contentEncoding: optional(string({ typeComment: 'Content encoding.' })),
  contentSchema: optional(normalRef(lazy(() => schema))),
  deprecated: optional(boolean({ typeComment: 'Whether the schema is deprecated.' })),
  discriminator: optional(discriminatorObject),
  readOnly: optional(boolean({ typeComment: 'Whether the schema is read-only.' })),
  writeOnly: optional(boolean({ typeComment: 'Whether the schema is write-only.' })),
  xml: optional(xml),
  externalDocs: optional(externalDocs),
  example: optional(
    any({
      typeComment:
        'A free-form field to include an example of an instance for this schema. Deprecated in favor of the JSON Schema examples keyword.',
    }),
  ),
  examples: optional(
    array(any(), {
      typeComment:
        'An array of examples of valid instances for this schema. This keyword follows the JSON Schema Draft 2020-12 specification.',
      typeName: 'SchemaExamplesArray',
    }),
  ),
  allOf: optional(array(normalRef(lazy(() => schema)), { typeName: 'SchemaObjectAllOf' })),
  oneOf: optional(array(normalRef(lazy(() => schema)), { typeName: 'SchemaObjectOneOf' })),
  anyOf: optional(array(normalRef(lazy(() => schema)), { typeName: 'SchemaObjectAnyOf' })),
  not: optional(normalRef(lazy(() => schema))),
})

const numericValidationKeywords = object({
  multipleOf: optional(number({ typeComment: 'Number must be a multiple of this value.' })),
  maximum: optional(number({ typeComment: 'Maximum value (inclusive).' })),
  exclusiveMaximum: optional(number({ typeComment: 'Maximum value (exclusive).' })),
  minimum: optional(number({ typeComment: 'Minimum value (inclusive).' })),
  exclusiveMinimum: optional(number({ typeComment: 'Minimum value (exclusive).' })),
})

const numericSchema: Schema = intersection(
  [
    object({
      type: union([literal('number'), literal('integer')]),
      format: optional(string({ typeComment: 'Different subtypes.' })),
    }),
    numericValidationKeywords,
  ],
  { typeName: 'NumberSchemaObject' },
)

const stringValidationKeywords = object({
  maxLength: optional(number({ typeComment: 'Maximum string length.' })),
  minLength: optional(number({ typeComment: 'Minimum string length.' })),
  pattern: optional(string({ typeComment: 'Regular expression pattern.' })),
})

const stringSchema = intersection(
  [
    object({
      type: literal('string'),
      format: optional(string({ typeComment: 'Different subtypes.' })),
    }),
    stringValidationKeywords,
  ],
  { typeName: 'StringSchemaObject' },
)

const objectValidationKeywords = object({
  maxProperties: optional(number({ typeComment: 'Maximum number of properties.' })),
  minProperties: optional(number({ typeComment: 'Minimum number of properties.' })),
  properties: optional(record(string(), normalRef(lazy(() => schema)), { typeName: 'SchemaObjectProperties' })),
  required: optional(array(string(), { typeName: 'SchemaObjectRequired' })),
  additionalProperties: optional(
    union([normalRef(lazy(() => schema)), object({}), boolean()], {
      typeName: 'SchemaObjectAdditionalProperties',
    }),
  ),
  patternProperties: optional(
    record(string(), normalRef(lazy(() => schema)), { typeName: 'SchemaObjectPatternProperties' }),
  ),
  propertyNames: optional(normalRef(lazy(() => schema))),
})

const objectSchema = intersection(
  [
    object({
      type: literal('object'),
    }),
    objectValidationKeywords,
  ],
  { typeName: 'ObjectSchemaObject' },
)

const arrayValidationKeywords = object({
  maxItems: optional(number({ typeComment: 'Maximum number of items in array.' })),
  minItems: optional(number({ typeComment: 'Minimum number of items in array.' })),
  uniqueItems: optional(boolean({ typeComment: 'Whether array items must be unique.' })),
  items: optional(normalRef(lazy(() => schema))),
  prefixItems: optional(array(normalRef(lazy(() => schema)), { typeComment: 'Schema for tuple validation.' })),
})

const arraySchema = intersection(
  [
    object({
      type: literal('array'),
    }),
    arrayValidationKeywords,
  ],
  { typeName: 'ArraySchemaObject' },
)

const schemaTypeMulti = union(
  [
    literal('null'),
    literal('boolean'),
    literal('string'),
    literal('number'),
    literal('integer'),
    literal('object'),
    literal('array'),
  ],
  { typeName: 'SchemaObjectMultiTypeKeywords' },
)

const otherTypeSchema = object({
  type: union([literal('null'), literal('boolean')], {
    typeName: 'SchemaObjectOtherTypeKeyword',
  }),
})

const multiTypeSchema = intersection(
  [
    object({
      type: array(schemaTypeMulti, {
        typeName: 'SchemaObjectMultiTypeKeywordArray',
      }),
      format: optional(string({ typeComment: 'Different subtypes.' })),
    }),
    numericValidationKeywords,
    stringValidationKeywords,
    arrayValidationKeywords,
    objectValidationKeywords,
  ],
  { typeName: 'MultiTypeSchemaObject' },
)

export const schema: Schema = intersection(
  [
    coreSchemaProperties,
    ...schemaExtensionObjects,
    union([otherTypeSchema, numericSchema, stringSchema, objectSchema, arraySchema, multiTypeSchema, object({})]),
  ],
  { typeName: 'SchemaObject' },
)
