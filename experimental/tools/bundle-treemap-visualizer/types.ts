/**
 * Shared shapes for the bundle treemap visualizer.
 *
 * Everything here is plain data so the scanner, the layout and the HTML writer
 * can be tested independently of one another.
 */

/** One file on disk, with the compressed sizes estimated from its bytes. */
export interface FileEntry {
  /** POSIX-style path relative to the scanned root. */
  path: string;
  /** Size on disk in bytes. */
  size: number;
  /** Estimated gzip size in bytes (sampled for large files). */
  gzipSize: number;
  /** Estimated brotli size in bytes (sampled for large files). */
  brotliSize: number;
}

/** A directory (or file) in the size tree. */
export interface TreeNode {
  /** Base name, `(root)` for the scanned directory itself. */
  name: string;
  /** Path relative to the scanned root. */
  path: string;
  /** Total bytes of this node, children included. */
  size: number;
  gzipSize: number;
  brotliSize: number;
  /** File count under this node. */
  fileCount: number;
  /** Present for directories; empty for files. */
  children: TreeNode[];
  /** `true` for a real file, `false` for a directory. */
  isFile: boolean;
}

export interface ScanOptions {
  /** Skip these directory names (defaults to node_modules, .git, dist, build). */
  ignore?: string[];
  /**
   * Files bigger than this are compressed from a sample instead of in full, so
   * the run stays fast on multi-megabyte assets. Defaults to 2 MiB.
   */
  sampleAboveBytes?: number;
  /** Hard cap on files scanned, to keep the report bounded. Defaults to 20000. */
  maxFiles?: number;
}

export interface ScanResult {
  /** Scanned root, as given. */
  root: string;
  files: FileEntry[];
  tree: TreeNode;
  totalSize: number;
  totalGzip: number;
  totalBrotli: number;
  /** Files skipped because of `maxFiles`, if any. */
  skipped: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One rectangle of the layout: a node plus where it goes. */
export interface TreemapRect {
  node: TreeNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReportOptions {
  /** Report width in SVG units. Defaults to 960. */
  width?: number;
  /** Report height in SVG units. Defaults to 600. */
  height?: number;
  /** How many files to list as heaviest. Defaults to 10. */
  top?: number;
}

export interface ReportData {
  root: string;
  generatedAt: string;
  width: number;
  height: number;
  totalSize: number;
  totalGzip: number;
  totalBrotli: number;
  fileCount: number;
  heaviest: FileEntry[];
  /** The tree, trimmed to the depth the report draws. */
  tree: TreeNode;
}
