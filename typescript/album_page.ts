import { HtmlElement } from "./html.js";

import { AlbumGui } from "./album.js";
import { AlbumImage, AlbumImageLod } from "./album_image.js";
import { AlbumStyle } from "./album_style.js";

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

class LayoutData {
  x: number = 0;
  y: number = 0;
  w: number = 0;
  h: number = 0;
  num_cols: number = 1;
  num_rows: number = 1;

  constructor({
    x: x = 0,
    y: y = 0,
    w: w = 100,
    h: h = 100,
    num_cols: num_cols = 1,
    num_rows: num_rows = 1,
  }: AlbumEntryDesc) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.num_cols = num_cols;
    this.num_rows = num_rows;
  }
}

export interface AlbumPageDesc {
  tag?: string;
  layout?: string;
  title?: string;
  entries?: AlbumEntryDesc[];
}

class Entry {
  layout: LayoutData;
  style: AlbumStyle;

  constructor(layout: LayoutData, style: AlbumStyle = new AlbumStyle()) {
    this.layout = layout;
    this.style = style;
  }

  static of_desc(album_gui: AlbumGui, desc: AlbumEntryDesc): Entry {
    if (desc.image === undefined) {
      throw new Error(`No image specified for page item entry`);
    }
    const image = album_gui.album.get_image(desc.image);
    if (image === null) {
      throw new Error(`Failed to find image ${desc.image} in album`);
    }
    let lod = 0;
    if (desc.lod !== undefined) {
      lod = desc.lod;
    }
    const layout = new LayoutData(desc);
    if (desc.page !== undefined) {
      const page = album_gui.album.get_page(desc.page);
      if (page === null) {
        throw new Error(`Failed to find page ${desc.page} in album`);
      }
      return new EntryPage(page, image, lod, layout, new AlbumStyle());
    } else {
      return new EntryImage(image, lod, layout, new AlbumStyle());
    }
  }

  create_div(
    page:AlbumPage,
    parent: HtmlElement,
    styles: [string, string][],
  ) {
    const div = parent.add_ele("div", {}, [["align", "center"]]);
    div.set_styles(styles);
    this.fill_div(page, div);
  }

  fill_div(_page:AlbumPage, _div: HtmlElement): void {}
}

export class EntryImage extends Entry {
  img: AlbumImage;
  lod: number;
  constructor(
    img: AlbumImage,
    lod: number,
    layout: LayoutData,
    style: AlbumStyle = new AlbumStyle(),
  ) {
    super(layout, style);
    this.img = img;
    this.lod = lod;
  }

  override fill_div(
    page: AlbumPage,
    div: HtmlElement,
  ) {
    const img_lod = this.img.get_lod(this.lod, this.layout.w);
    if (img_lod !== null) {
      page.create_img_link(div, img_lod, this.layout.w);
      page.create_img_caption(div, this.img, img_lod);
    }
  }
}

export class EntryPage extends Entry {
  img: AlbumImage;
  lod: number;
  page: AlbumPage;
  constructor(
    page: AlbumPage,
    img: AlbumImage,
    lod: number,
    layout: LayoutData,
    style: AlbumStyle = new AlbumStyle(),
  ) {
    super(layout, style);
    this.page = page;
    this.img = img;
    this.lod = lod;
  }

  override fill_div(
    page: AlbumPage,
    div: HtmlElement,
  ) {
    const img_lod = this.img.get_lod(this.lod, this.layout.w);
    this.style.ele_style_attr(div, [
      "color",
      "background",
      "pad",
      "border",
      "margin",
    ]);

    if (img_lod !== null) {
      const a = page.create_a_set_page(div, this.page);
      this.style.ele_style_attr(a, ["color"]);
      page.create_img_link(a, img_lod, this.layout.w);
    }
    if (this.page.title !== null) {
      div.add_ele("p");
      const a = page.create_a_set_page(div, this.page);
      this.style.ele_style_attr(a, ["color"]);
      a.add_content(this.page.title);
    }
  }
}

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

export class AlbumPage {
  album_gui: AlbumGui;
  layout: PageLayout;
  style: AlbumStyle;
  title: string;
  heading: string;
  _tag: string;

  constructor(
    album_gui: AlbumGui,
    tag: string,
    title: string,
    layout: PageLayout = new PageLayoutTable(),
    style: AlbumStyle = new AlbumStyle(),
  ) {
    this.album_gui = album_gui;
    this._tag = tag;
    this.style = style;
    this.title = title;
    this.heading = title;
    this.layout = layout;
  }

  static of_desc(
    album_gui: AlbumGui,
    {
      tag: t = "<no tag>",
      title: tt = "<no title given>",
      layout: al = "grid",
      entries: e = [],
    }: AlbumPageDesc,
  ): AlbumPage {
    let layout : PageLayout = new PageLayoutTable();
    if (al == "placed") {
      layout = new PageLayoutPlace();
    }
    const page = new AlbumPage(album_gui, t, tt, layout);

    for (const entry_desc of e) {
      page.layout.add_entry(album_gui, entry_desc);
    }
    return page;
  }

  tag(): string {
    return this._tag;
  }

  create_img_tag(
    parent: HtmlElement,
    img_lod: AlbumImageLod,
    width: number,
  ): HtmlElement {
     const e = parent.add_ele("img", {}, [
        ["src", this.album_gui.album.img_filename(img_lod.filename)],
      ]);
    e.set_styles([["width", `${width}px`]]);
    return e;
  }

  create_img_link(
    parent: HtmlElement,
    img_lod: AlbumImageLod,
    width: number,
  ): HtmlElement {
    const href_filename = this.album_gui.album.img_filename(img_lod.filename);
    const a = parent.add_ele("a", {}, [["href", href_filename]]);
    this.create_img_tag(a, img_lod, width);
    return a;
  }

  create_img_caption(
    parent: HtmlElement,
    image: AlbumImage,
    img_lod: AlbumImageLod,
  ): HtmlElement | null{
    if (image.caption()!="") {
      const href_filename = this.album_gui.album.img_filename(img_lod.filename);
      const a = parent.add_ele("a", {}, [["href", href_filename]]);
      this.style.ele_style_attr(a, ["color"]);
      a.add_content(image.caption());
      return a;
    } else {
      return null;
    }
  }

  create_a_set_page(
    parent: HtmlElement,
    page: AlbumPage,
  ): HtmlElement {
    const album_gui = this.album_gui;
    const href = "#select_this_page" + page.tag();
    const a = parent.add_ele("a", {}, [["href", href]]);
    const this_tag = this._tag;
    a.ele.addEventListener("click", (_e) => album_gui.album_set_page(this_tag));
    return a;
  }

  mk_body(html: HtmlElement) {
    html.clear();
    this.style.ele_style_attr(html, [
      "color",
      "background",
      "pad",
      "border",
      "margin",
    ]);
    // text = doc.createTextNode(this.heading);
    // h1.appendChild(text);
    // div.appendChild(h1);
    this.layout.create_html(this, html);
  }
}
