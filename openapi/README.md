# Tiger Cloud OpenAPI source

`tiger-cloud.yml` is vendored from the
[`stainless-sdks/tiger-cloud-openapi`](https://github.com/stainless-sdks/tiger-cloud-openapi)
repository. Keeping the source in this repository makes local and production
documentation builds deterministic and removes the need for Stainless credentials.

Refresh it with:

```bash
pnpm openapi:update
pnpm build
```

The upstream document includes entries marked `x-tigerdata-internal` and
`x-tigerdata-preview`. `src/lib/tiger-cloud-openapi.ts` removes those operations
before Starlight generates public API pages. Do not point the documentation
plugin directly at the unfiltered vendored file.
