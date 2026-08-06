/** These should be kept in sync with the Rust web_album descriptors
 *
 *
 */

export interface AlbumImageDataDesc {
  filename?: string;
  width?: number;
  height?: number;
  lod?: number;
}

export interface AlbumImageDesc {
  tag?: string;
  caption?: string;
  timestamp?: number;
  lat?: number;
  lon?: number;
  dir?: number;
  data?: AlbumImageDataDesc[];
}

export interface AlbumMapDesc {
  tag?: string;
  caption?: string;
  image?: string;
  corners?: number[];
}

/**
 * An album page entry description
 *
 */
export interface AlbumEntryDesc {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  num_cols?: number;
  num_rows?: number;
  image?: string;
  lod?: number;
  page?: string;
  entries?: AlbumEntryDesc[];
}

export interface AlbumPageDesc {
  tag?: string;
  layout?: string;
  title?: string;
  entries?: AlbumEntryDesc[];
}

export interface AlbumDesc {
  default_page?: string;
  img_rel_dir?: string;
  images?: AlbumImageDesc[];
  pages?: AlbumPageDesc[];
}
