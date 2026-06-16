# @scalar/scalar

The [Scalar API Reference](https://github.com/scalar/scalar) bundled as a single, code-split
ECMAScript module — built to be loaded straight from a CDN with a plain module import, no build step
required.

```html
<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>

    <script type="module">
      import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/scalar'

      createApiReference('#app', {
        // The URL of the OpenAPI/Swagger document
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
      })
    </script>
  </body>
</html>
```

## Why this package

`@scalar/api-reference` is most commonly loaded from jsDelivr as the UMD `standalone.js` build — a
single, multi-megabyte file that sets a global `Scalar` object. This package is the ESM counterpart:
the same API Reference, but **code-split**, so the heavy and rarely-needed pieces (the API client
modal, the YAML parser, the per-icon modules) stay in lazy chunks that only load when used. The
result is a much smaller initial download.

It is published under a short package name so the CDN URL stays clean:
`https://cdn.jsdelivr.net/npm/@scalar/scalar`.

## API

This package re-exports `createApiReference` from `@scalar/api-reference` and also sets it on
`window.Scalar` for parity with the UMD build. See the
[HTML/JS integration docs](https://github.com/scalar/scalar/blob/main/documentation/integrations/html-js.md)
for the full configuration and JavaScript API.
