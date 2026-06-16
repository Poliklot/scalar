import { posix } from 'node:path'

import { type Plugin, defineConfig } from 'vite'
import banner from 'vite-plugin-banner'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

import { name, version } from './package.json'

/**
 * Where the lazy chunks live at runtime.
 *
 * The whole point of this package is that it can be loaded from a bare CDN URL
 * (`https://cdn.jsdelivr.net/npm/@scalar/scalar`). jsDelivr serves that bare URL *inline* — it does
 * not redirect to the real file path — so a relative `./chunks/...` import would resolve against the
 * wrong base and 404. To make code-splitting work from the bare URL we therefore bake an **absolute**
 * URL (pinned to this exact package + version) into every chunk reference.
 *
 * Override `SCALAR_CDN_BASE` (must end with a trailing slash) to point the chunks somewhere else —
 * e.g. a local server when verifying a build, or a different CDN.
 */
const CDN_BASE = process.env.SCALAR_CDN_BASE ?? `https://cdn.jsdelivr.net/npm/${name}@${version}/dist/`

/**
 * Rewrite every relative chunk import in the build output to an absolute `CDN_BASE` URL.
 *
 * `experimental.renderBuiltUrl` does not touch chunk-to-chunk import specifiers under Rolldown's
 * library build, so we do it ourselves in `generateBundle`: each relative specifier is resolved
 * against its own chunk's directory, then re-pointed at the absolute CDN URL. This makes both the
 * eager (`import … from`) and lazy (`import(…)`) chunks resolve correctly when the entry is loaded
 * from the bare CDN URL, where relative resolution would otherwise break.
 */
const rewriteChunkUrlsToCdn = (): Plugin => {
  // Matches the specifier of static imports/re-exports (`from"…"`), side-effect imports (`import"…"`)
  // and dynamic imports (`import("…")`), while ignoring property access like `Array.from("…")`.
  const importSpecifier = /(?<![\w.$])((?:from|import)\s*\(?\s*)(["'])([^"']+)\2/g

  return {
    name: 'scalar:rewrite-chunk-urls-to-cdn',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk') {
          continue
        }

        const fromDir = posix.dirname(file.fileName)

        file.code = file.code.replace(importSpecifier, (match, prefix, quote, specifier) => {
          if (!specifier.startsWith('.')) {
            return match
          }

          // Resolve the relative specifier to a path relative to the dist root, then make it absolute.
          const resolved = posix.normalize(posix.join(fromDir, specifier))
          return `${prefix}${quote}${CDN_BASE}${resolved}${quote}`
        })
      }
    },
  }
}

const licenseBanner = `/**
 * ${name} ${version}
 *
 * The Scalar API Reference, bundled as a single code-split ES module.
 *
 * Website: https://scalar.com
 * GitHub:  https://github.com/scalar/scalar
 * License: https://github.com/scalar/scalar/blob/main/LICENSE
**/`

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    rewriteChunkUrlsToCdn(),
    // Inline the bundled CSS and inject it at runtime, tagged with a known id so the runtime can
    // detach it on `destroy()`. `useStrictCSP` lets the injected <style> pick up a CSP nonce from a
    // `<meta property="csp-nonce">` tag. Kept in sync with the standalone build in @scalar/api-reference.
    cssInjectedByJsPlugin({ attributes: { id: 'scalar-style' }, useStrictCSP: true }),
    banner({ outDir: 'dist', content: licenseBanner }),
  ],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    cssCodeSplit: false,
    lib: {
      entry: { index: 'src/index.ts' },
      name,
      formats: ['es'],
    },
    rolldownOptions: {
      // An ESM bundle loaded via `import` in the browser cannot resolve bare specifiers, so it must
      // be fully self-contained: bundle everything and let tree-shaking drop the unreachable parts.
      treeshake: {
        moduleSideEffects: (id) => id.includes('.css'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        // Keep genuinely-async boundaries (API client modal, YAML parser, per-icon imports) as real
        // lazy chunks instead of inlining them into the entry.
        codeSplitting: true,
        // Vite forces `minifyWhitespace: false` for ES library builds; enable Rolldown's native
        // minifier to get a fully-minified bundle.
        minify: true,
      },
    },
  },
})
