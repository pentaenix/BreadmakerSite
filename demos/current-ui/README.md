These are read-only product-preview assets from the verified Breadmaker Editor
commit recorded in `source.json`, rendered with invented sample data. They replace
the original site's old app visuals inside its existing frames.

CSS keeps the canonical app's module boundaries, including its longer Manuscript,
Canvas and Reviews stylesheets. Mirroring those boundaries avoids a second style
implementation and preserves the actual product appearance. Changes are limited
to local asset URL resolution and insignificant trailing whitespace. Upstream
file hashes are recorded for traceability. This is deliberately a source snapshot,
not a refactor of the Editor or the site's design.

The frame HTML is exported from the rendered app, with live input values and
scroll positions preserved. Inactive workspaces and transient overlays are removed,
and writing surfaces are read-only. The original lightweight preview interactions
are handled in `../demo.js`; no Editor backend or user account is connected.
