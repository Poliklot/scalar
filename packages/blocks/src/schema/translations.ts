export type SchemaTranslationKey =
  | 'actions.copyLinkTo'
  | 'common.additionalProperties'
  | 'common.const'
  | 'common.deprecated'
  | 'common.discriminator'
  | 'common.enum'
  | 'common.format'
  | 'common.greaterThan'
  | 'common.hideValues'
  | 'common.keys'
  | 'common.lessThan'
  | 'common.max'
  | 'common.maxLength'
  | 'common.min'
  | 'common.minLength'
  | 'common.multipleOf'
  | 'common.nullable'
  | 'common.pattern'
  | 'common.propertyNames'
  | 'common.readOnly'
  | 'common.required'
  | 'common.showAllValues'
  | 'common.type'
  | 'common.unique'
  | 'common.values'
  | 'common.writeOnly'
  | 'schema.allOf'
  | 'schema.anyOf'
  | 'schema.childAttributes'
  | 'schema.default'
  | 'schema.emptyObject'
  | 'schema.example'
  | 'schema.examples'
  | 'schema.forName'
  | 'schema.hideChildAttributes'
  | 'schema.not'
  | 'schema.oneOf'
  | 'schema.schema'
  | 'schema.showAdditionalProperties'
  | 'schema.showChildAttributes'
  | 'schema.showSchemaDetails'
  | 'schema.unknownType'

export type SchemaTranslate = (key: SchemaTranslationKey, params?: Record<string, number | string>) => string

const defaultSchemaTranslations = {
  'actions.copyLinkTo': 'Copy link to {name}',
  'common.additionalProperties': 'additional properties',
  'common.const': 'const',
  'common.deprecated': 'deprecated',
  'common.discriminator': 'Discriminator',
  'common.enum': 'enum',
  'common.format': 'Format',
  'common.greaterThan': 'greater than',
  'common.hideValues': 'Hide values',
  'common.keys': 'keys',
  'common.lessThan': 'less than',
  'common.max': 'max',
  'common.maxLength': 'max length',
  'common.min': 'min',
  'common.minLength': 'min length',
  'common.multipleOf': 'multiple of',
  'common.nullable': 'nullable',
  'common.pattern': 'Pattern',
  'common.propertyNames': 'property names',
  'common.readOnly': 'read-only',
  'common.required': 'required',
  'common.showAllValues': 'Show all values',
  'common.type': 'Type',
  'common.unique': 'unique',
  'common.values': 'values',
  'common.writeOnly': 'write-only',
  'schema.allOf': 'All of',
  'schema.anyOf': 'Any of',
  'schema.childAttributes': 'Child Attributes',
  'schema.default': 'Default',
  'schema.emptyObject': 'Empty object',
  'schema.example': 'Example',
  'schema.examples': 'Examples',
  'schema.forName': 'for {name}',
  'schema.hideChildAttributes': 'Hide {name}',
  'schema.not': 'Not',
  'schema.oneOf': 'One of',
  'schema.schema': 'Schema',
  'schema.showAdditionalProperties': 'Show additional properties',
  'schema.showChildAttributes': 'Show {name}',
  'schema.showSchemaDetails': 'Show Schema Details',
  'schema.unknownType': 'unknown type',
} satisfies Record<SchemaTranslationKey, string>

export const defaultSchemaTranslate: SchemaTranslate = (key, params) => {
  const template = defaultSchemaTranslations[key]

  if (!params) {
    return template
  }

  return Object.entries(params).reduce(
    (result, [param, value]) => result.replaceAll(`{${param}}`, String(value)),
    template,
  )
}

export const getSchemaTranslate = (translate?: SchemaTranslate): SchemaTranslate => translate ?? defaultSchemaTranslate
