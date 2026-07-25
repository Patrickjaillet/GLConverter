# GLConverter

Code golfing to structured code converter, and vice versa.

GLConverter converts source code between a fully structured, readable form
and a golfed form, with a minified or justified output mode. The original
code and the converted code are shown side by side, and edits are reflected
automatically between the two views.

![GLConverter screenshot](docs/screenshot.png)

## Status

Version `0.3.0` — golfing conversion engine (minification, variable
renaming, operator simplification, declaration merging, dead code
elimination) with a Minified / Justified output toggle. See
`CHANGELOG.md` for details.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production build is output to `dist/` and is fully static, making it
directly deployable to GitHub Pages.

## License

Copyright © 2026 Patrick JAILLET — All rights reserved.
See `LICENSE` for details.

Email: contact.shaderstudio@gmail.com
Website: https://patrickjaillet.github.io/sandefjord-software
