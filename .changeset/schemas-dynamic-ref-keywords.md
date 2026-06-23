---
'@scalar/schemas': patch
---

Add JSON Schema 2020-12 reference keywords (`$id`, `$anchor`, `$dynamicAnchor`, `$dynamicRef`) to the OpenAPI 3.1 Schema Object, matching the workspace-store definition so coercion through this schema keeps them instead of dropping the dynamic item binding of generic templates like `PaginatedResponse<T>`
