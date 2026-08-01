import { HtmlElement } from "./html.js";

import { Album, AlbumGui } from "./album.js";
import { AlbumImage } from "./album_image.js";
import { AlbumStyle } from "./album_style.js";

export interface PlacedItem {
  center: [number, number];
  dims(): [number, number];
}

export interface Placement {
  center?: [number, number];
  width?: number;
  height?: number;
  caption?: string;
  image_name?: string;
  lod?: number;
}

export class PlacedBase implements PlacedItem {
  center: [number, number];
  dims(): [number, number] {
    return [0, 0];
  }
  constructor(placement: Placement) {
    this.center = [0, 0];
    if (placement.center !== undefined) {
      this.center[0] = placement.center[0];
      this.center[1] = placement.center[1];
    }
  }
}

export class PlacedImage extends PlacedBase implements PlacedItem {
  image_name: string;
  caption: string = "";
  width: number = 0;
  height: number = 0;
  lod: number = 0;
  constructor(placement: Placement) {
    super(placement);
    if (placement.image_name === undefined) {
      throw new Error("Image name required for a PlacedImage");
    }
    this.image_name = placement.image_name;
    if (placement.caption !== undefined) {
      this.caption = placement.caption;
    }
    if (placement.lod !== undefined) {
      this.lod = placement.lod;
    }
    if (placement.width !== undefined) {
      this.width = placement.width;
    }
    if (placement.height !== undefined) {
      this.height = placement.height;
    }
  }
  override dims(): [number, number] {
    return [this.width, this.height];
  }
}

export class PlacedGroup extends PlacedBase implements PlacedItem {
  contents: PlacedItem[];
  constructor(placement: Placement) {
    super(placement);
    this.contents = [];
  }
}

export interface AlbumEntryDesc {
  x?: number;
  y?: number;
  num_cols?: number;
  num_rows?: number;
  image?: string;
  page?: string;
}

export interface AlbumPageDesc {
  tag?: string;
  title?: string;
  entries?: AlbumEntryDesc[];
}

class Entry {
  x: number;
  y: number;
  num_cols: number;
  num_rows: number;
  img: AlbumImage;
  style: AlbumStyle;
  page: AlbumPage | null;

  constructor(
    num_cols: number,
    num_rows: number,
    img: AlbumImage,
    style: AlbumStyle,
    page: AlbumPage | null = null,
    x: number = 0,
    y: number = 0,
  ) {
    this.x = x;
    this.y = y;
    this.num_cols = num_cols;
    this.num_rows = num_rows;
    this.img = img;
    this.style = style;
    this.page = page;
  }

  static of_json(
    album: Album,
    {
      x: lx = 0,
      y: ty = 0,
      num_cols: nc = 1,
      num_rows: nr = 1,
      image: i = "",
      page: p = "",
    }: AlbumEntryDesc,
  ): Entry {
    const img = album.get_image(i);
    if (img === null) {
      throw new Error(`Failed to find image ${i} in album`);
    }
    const page = p == "" ? null : album.get_page(p);
    const entry = new Entry(nc, nr, img!, new AlbumStyle(), page, lx, ty);
    return entry;
  }

  create_div(
    album_gui: AlbumGui,
    album: Album,
    parent: HtmlElement,
    style: AlbumStyle,
  ) {
    const render_style = style.merged_with(this.style);
    if (this.page === null) {
      this.img.create_div(album_gui, album, parent, render_style);
    } else {
      this.page.create_div(album_gui, parent, this.img, render_style);
    }
  }
}

export class AlbumPage {
  album: Album;
  style: AlbumStyle;
  title: string;
  heading: string;
  _tag: string;

  num_columns: number = 0;
  num_rows: number = 0;

  // entries is a map from x+1000*y to the entry starting at (x,y)
  entries: Map<number, Entry>;
  rows_cols: Map<number, number[]>;

  constructor(
    album: Album,
    tag: string,
    title: string,
    style: AlbumStyle = new AlbumStyle(),
  ) {
    this.album = album;
    this._tag = tag;
    this.style = style;
    this.title = title;
    this.heading = title;
    this.entries = new Map();
    this.rows_cols = new Map();
  }

  static of_json(
    album: Album,
    {
      tag: t = "<no tag>",
      title: tt = "<no title given>",
      entries: e = [],
    }: AlbumPageDesc,
  ): AlbumPage {
    const page = new AlbumPage(album, t, tt);
    for (const entry_desc of e) {
      const entry = Entry.of_json(album, entry_desc);
      page.add_entry(entry, entry.x, entry.y, entry.num_cols, entry.num_rows);
    }
    return page;
  }

  tag(): string {
    return this._tag;
  }
  private add_entry(
    e: Entry,
    lx: number,
    ty: number,
    num_cols: number,
    num_rows: number,
  ) {
    this.entries.set(lx + 1000 * ty, e);

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

  add_image(
    lx: number,
    ty: number,
    tag: string,
    style: AlbumStyle = new AlbumStyle(),
    num_cols: number = 1,
    num_rows: number = 1,
  ) {
    const img = this.album.get_image(tag);
    if (img === null) {
      throw new Error("Cannot find image " + tag + " in album");
    }
    const entry = new Entry(num_cols, num_rows, img, style);
    this.add_entry(entry, lx, ty, num_cols, num_rows);
  }

  add_page(
    lx: number,
    ty: number,
    tag: string,
    img_tag: string,
    style: AlbumStyle = new AlbumStyle(),
    num_cols: number = 1,
    num_rows: number = 1,
  ) {
    const page = this.album.get_page(tag);
    const img = this.album.get_image(img_tag);
    if (img === null) {
      throw new Error("Cannot find image " + tag + " in album");
    }
    if (page === null) {
      throw new Error("Cannot find page " + tag + " in album");
    }
    const entry = new Entry(num_cols, num_rows, img, style, page);
    this.add_entry(entry, lx, ty, num_cols, num_rows);
  }

  create_div(
    album_gui: AlbumGui,
    parent: HtmlElement,
    img: AlbumImage,
    style: AlbumStyle,
  ): HtmlElement {
    const div = parent.add_ele("div", {}, [["align", "center"]]);
    const href = "#select_this_page" + this.tag;
    style.ele_style_attr(div, [
      "color",
      "background",
      "pad",
      "border",
      "margin",
    ]);
    const a = div.add_ele("a", {}, [["href", href]]);
    style.ele_style_attr(a, ["color"]);
    const this_tag = this._tag;
    a.ele.addEventListener("click", (_e) => album_gui.album_set_page(this_tag));
    img.create_img(this.album, a, style);
    if (this.title !== null) {
      div.add_ele("p");
      const a = div.add_ele("a", { classes: "caption" });
      style.ele_style_attr(a, ["color"]);
      a.ele.addEventListener("click", (_e) =>
        album_gui.album_set_page(this_tag),
      );
      a.add_content(this.title);
    }
    return div;
  }

  mk_body(album_gui: AlbumGui, html: HtmlElement) {
    html.clear();
    this.style.ele_style_attr(html, [
      "color",
      "background",
      "pad",
      "border",
      "margin",
    ]);
    const table = html.add_ele("table");
    // text = doc.createTextNode(this.heading);
    // h1.appendChild(text);
    // div.appendChild(h1);
    // table = this.mk_table_of_entries(doc);
    // table.setAttribute("align", "center");

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
          colspan = entry.num_cols;
          const tag_values: [string, string][] = [];
          if (entry.num_cols > 1) {
            tag_values.push(["colspan", entry.num_cols.toString()]);
          }
          if (entry.num_rows > 1) {
            tag_values.push(["rowspan", entry.num_rows.toString()]);
          }
          const td = tr.add_ele("td", {}, tag_values);
          entry.create_div(album_gui, this.album, td, this.style);
        }
      }
    }
  }
}
