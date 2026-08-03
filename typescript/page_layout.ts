import { HtmlElement } from "./html.js";

import { AlbumGui } from "./album.js";
import { AlbumPage } from "./album_page.js";
import { AlbumEntryDesc } from "./album_desc.js";
import { Entry } from "./page_entry.js";

export interface PageLayout {
  add_entry(album_gui: AlbumGui, entry_desc: AlbumEntryDesc): void;
  create_html(page: AlbumPage, html: HtmlElement): void;
}

export class PageLayoutTable implements PageLayout {
  num_columns: number = 0;
  num_rows: number = 0;

  // entries is a map from x+1000*y to the entry starting at (x,y)
  entries: Map<number, Entry>;
  rows_cols: Map<number, number[]>;

  constructor() {
    this.entries = new Map();
    this.rows_cols = new Map();
  }

  add_entry(album_gui: AlbumGui, entry_desc: AlbumEntryDesc) {
    const entry = Entry.of_desc(album_gui, entry_desc);

    const lx = entry.layout.x;
    const ty = entry.layout.y;
    const num_rows = entry.layout.num_rows;
    const num_cols = entry.layout.num_cols;
    this.entries.set(lx + 1000 * ty, entry);

    if (this.rows_cols.get(ty) === undefined) {
      this.rows_cols.set(ty, []);
    }
    this.rows_cols.get(ty)!.push(lx);
    if (lx + num_cols > this.num_columns) {
      this.num_columns = lx + num_cols;
    }
    if (ty + num_rows > this.num_rows) {
      this.num_rows = ty + num_rows;
    }
  }

  create_html(page: AlbumPage, html: HtmlElement) {
    const table = html.add_ele("table");
    // This was an attribute
    table.set_styles([["align", "center"]]);

    for (let y = 0; y <= this.num_rows; y++) {
      const tr = table.add_ele("tr");
      const cols = this.rows_cols.get(y);
      if (cols === undefined) {
        continue;
      }
      cols.sort();
      let colspan = 0;
      for (let x = 0; x < this.num_columns; x++) {
        const entry = this.entries.get(x + y * 1000);
        if (entry === undefined) {
          if (colspan > 1) {
            colspan = colspan - 1;
          } else {
            tr.add_ele("td", { classes: "filler" });
          }
        } else {
          colspan = entry.layout.num_cols;
          const tag_values: [string, string][] = [];
          if (entry.layout.num_cols > 1) {
            tag_values.push(["colspan", entry.layout.num_cols.toString()]);
          }
          if (entry.layout.num_rows > 1) {
            tag_values.push(["rowspan", entry.layout.num_rows.toString()]);
          }
          const td = tr.add_ele("td", {}, tag_values);
          entry.create_div(page, td, []);
        }
      }
    }
  }
}

export class PageLayoutPlace implements PageLayout {
  bbox: [number, number, number, number];
  entries: Entry[];

  constructor() {
    this.entries = [];
    this.bbox = [0, 0, 0, 0];
  }

  add_entry(album_gui: AlbumGui, entry_desc: AlbumEntryDesc) {
    const entry = Entry.of_desc(album_gui, entry_desc);

    const x = entry.layout.x;
    const y = entry.layout.y;
    const w = entry.layout.w;
    const h = entry.layout.h;
    this.bbox[0] = Math.min(this.bbox[0], x - w / 2);
    this.bbox[1] = Math.min(this.bbox[1], y - h / 2);
    this.bbox[2] = Math.max(this.bbox[2], x + w / 2);
    this.bbox[3] = Math.max(this.bbox[3], y + h / 2);
    this.entries.push(entry);
  }

  create_html(page: AlbumPage, html: HtmlElement) {
    const div = html.add_ele("div");
    const width = this.bbox[2] - this.bbox[0];
    const height = this.bbox[3] - this.bbox[1];
    div.set_styles([
      ["width", `${width}px`],
      ["height", `${height}px`],
    ]);
    const dx = this.bbox[0];
    const dy = this.bbox[1];
    for (const e of this.entries) {
      const lx = e.layout.x - e.layout.w / 2 - dx;
      const ty = e.layout.y - e.layout.h / 2 - dy;
      const rx = lx + e.layout.w;
      const by = ty + e.layout.h;
      const styles: [string, string][] = [
        ["position", "absolute"],
        ["left", `${lx}px`],
        ["right", `${rx}px`],
        ["top", `${ty}px`],
        ["bottom", `${by}px`],
      ];
      e.create_div(page, div, styles);
    }
  }
}
