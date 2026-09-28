# bundle-treemap-visualizer

Standalone bundle-size treemap generator for the experimental tools workspace.

Point it at a directory, get back **one self-contained HTML file** that shows
what the code weighs as an interactive treemap: every rectangle is a file or a
directory sized by byte weight, hovering shows the details, and clicking a
directory drills into it. No webpack, no vite, no dev server, no build step —
open the file from disk or attach it to a PR.

## Usage

```bash
# from experimental/tools/bundle-treemap-visualizer
npm install
npm run dev -- --dir ../../../packages/app --out bundle-treemap.html --open

# once compiled
node dist/cli.js --dir ./src --out report.html
```

Flags:

| flag | meaning |
| --- | --- |
| `--dir <path>` | directory to scan (default: current directory) |
| `--out <file>` | where to write the report (default: `bundle-treemap.html`) |
| `--open` | open the report in the default browser |
| `--width <px>` / `--height <px>` | report size in SVG units (default: 960 × 600) |
| `--top <n>` | how many heaviest files to list (default: 10) |
| `--ignore <names>` | comma-separated directory names to skip |
| `--help` | usage |

Example output:

```
/home/me/app
  files: 412
  on disk: 3.4 MB | gzip ~912 KB | brotli ~703 KB
  heaviest 3 files:
  assets/hero.png                        1.2 MB  gzip     1.2 MB  brotli     1.2 MB
  dist/app.js                            840 KB  gzip     210 KB  brotli     180 KB
  src/data/catalog.json                  610 KB  gzip      88 KB  brotli      71 KB
  report: /home/me/app/bundle-treemap.html
```

## What it does

- **Scans** a directory recursively and measures every file on disk, skipping
  `node_modules`, `.git`, `dist`, `build`, `.next` and `coverage` by default.
- **Estimates** gzip and brotli weight per file using `node:zlib`. Files above
  2 MiB are compressed from a 256 KiB sample and scaled, so a directory of
  large assets still scans in seconds; the numbers are labelled as estimates.
- **Lays out** a squarified treemap (Bruls, Huizing & van Wijk): rectangles are
  packed in rows along the shorter side of the remaining space, which keeps
  cells as close to square as possible. Each directory gets its own layout in
  fractions of its box, so drill-down in the browser needs no re-layout.
- **Writes** a single HTML file: inline styles, inline SVG, the layout as JSON,
  hover tooltips, click-to-drill-down with a breadcrumb, and a side table of
  the heaviest files.

## Layout of this tool

```
bundle-treemap-visualizer/
├── cli.ts                  # flag parsing, stdout summary, --open
├── treemapGenerator.ts     # scanner, compression estimates, squarify, HTML
├── types.ts                # shared shapes
├── treemapGenerator.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

The scanner, the layout and the HTML writer are exported and independent, so
they can be tested — and reused — separately.

## Tests

```bash
npm test          # vitest run
npm run typecheck # tsc --noEmit
```

The suite builds a fixture directory in `os.tmpdir()` with known byte counts
and asserts: directory totals and tree aggregation match the fixture exactly;
the ignore list and the file cap are honoured; compression estimates never
exceed the raw size and compress repetitive input; the squarified layout tiles
its rectangle without overlaps or holes and keeps area proportional to size;
the HTML is valid HTML5 with an embedded SVG and no external references; and
hostile file names are escaped in both the markup and the embedded JSON.

## Constraints

- Zero runtime dependencies: `node:fs`, `node:path`, `node:zlib`,
  `node:child_process` and nothing else.
- Confined to this directory — nothing outside it is touched.
- Does not run `npm run build`; use `npm run typecheck` (or `npm run dev` with
  `ts-node`) while working on it.
