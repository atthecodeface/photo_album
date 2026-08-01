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
  page?: string;
  entries?: AlbumEntryDesc[];
}

export interface PageLayout {
  add_entry(album: Album, entry_desc: AlbumEntryDesc): void;
}

export class PageLayoutTable implements PageLayout {
  add_entry(_album: Album, _entry_desc: AlbumEntryDesc) { }

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

  static of_json(album: Album, desc: AlbumEntryDesc): Entry {
    if (desc.image === undefined) {
      throw new Error(`No image specified for page item entry`);
    }
    const image = album.get_image(desc.image);
    if (image === null) {
      throw new Error(`Failed to find image ${desc.image} in album`);
    }
    const layout = new LayoutData(desc);
    if (desc.page !== undefined) {
      const page = album.get_page(desc.page);
      if (page === null) {
        throw new Error(`Failed to find page ${desc.page} in album`);
      }
      return new EntryPage(page, image, layout, new AlbumStyle());
    } else {
      return new EntryImage(image, layout, new AlbumStyle());
    }
  }

  create_div(
    album_gui: AlbumGui,
    album: Album,
    parent: HtmlElement,
    _style: AlbumStyle,
  ) {
    const div = parent.add_ele("div", {}, [["align", "center"]]);
    this.fill_div(album_gui, album, div);
  }

  fill_div(_album_gui: AlbumGui, _album: Album, _div: HtmlElement): void {}
}

export class EntryImage extends Entry {
  img: AlbumImage;
  constructor(
    img: AlbumImage,
    layout: LayoutData,
    style: AlbumStyle = new AlbumStyle(),
  ) {
    super(layout, style);
    this.img = img;
  }

  override fill_div(
    _album_gui: AlbumGui,
    album: Album,
    div: HtmlElement,
  ): HtmlElement {
    const href_filename = album.img_filename(this.img.filename);
    const a = div.add_ele("a", {}, [["href", href_filename]]);
    this.style.ele_style_attr(a, ["color"]);
    this.img.create_img(album, a, this.layout.w);
    if (this.img.caption !== null) {
      div.add_ele("p");
      const a = div.add_ele("a", { classes: "caption" }, [
        ["href", href_filename],
      ]);
      this.style.ele_style_attr(a, ["color"]);
      a.add_content(this.img.caption);
    }
    return div;
  }
}

export class EntryPage extends Entry {
  img: AlbumImage;
  page: AlbumPage;
  constructor(
    page: AlbumPage,
    img: AlbumImage,
    layout: LayoutData,
    style: AlbumStyle = new AlbumStyle(),
  ) {
    super(layout, style);
    this.page = page;
    this.img = img;
  }
  override fill_div(
    album_gui: AlbumGui,
    album: Album,
    div: HtmlElement,
  ): HtmlElement {
    const this_tag = this.page.tag();
    const href = "#select_this_page" + this_tag;
    this.style.ele_style_attr(div, [
      "color",
      "background",
      "pad",
      "border",
      "margin",
    ]);
    const a = div.add_ele("a", {}, [["href", href]]);
    this.style.ele_style_attr(a, ["color"]);
    a.ele.addEventListener("click", (_e) => album_gui.album_set_page(this_tag));
    this.img.create_img(album, a, this.layout.w);
    if (this.page!.title !== null) {
      div.add_ele("p");
      const a = div.add_ele("a", { classes: "caption" });
      this.style.ele_style_attr(a, ["color"]);
      a.ele.addEventListener("click", (_e) =>
        album_gui.album_set_page(this_tag),
      );
      a.add_content(this.page!.title);
    }
    return div;
  }
}

export class AlbumPage {
  album: Album;
  layout: PageLayout;
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
    layout: PageLayout = new PageLayoutTable(),
  ) {
    this.album = album;
    this._tag = tag;
    this.style = style;
    this.title = title;
    this.heading = title;
    this.layout = layout;
    this.entries = new Map();
    this.rows_cols = new Map();
  }

  static of_json(
    album: Album,
    {
      tag: t = "<no tag>",
      title: tt = "<no title given>",
      // layout: al = "grid",
      entries: e = [],
    }: AlbumPageDesc,
  ): AlbumPage {
    const page = new AlbumPage(album, t, tt);
    /*
    if (al == "placed") {
      page.layout = AlbumPageLayoutType.Placed;
    }
    */
    for (const entry_desc of e) {
      const entry = Entry.of_json(album, entry_desc);
      page.add_entry(entry);
    }
    return page;
  }

  tag(): string {
    return this._tag;
  }

  private add_entry(
    e: Entry,
  ) {
    const lx = e.layout.x;
    const ty = e.layout.y;
    const num_rows = e.layout.num_rows;
    const num_cols = e.layout.num_cols;
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
          colspan = entry.layout.num_cols;
          const tag_values: [string, string][] = [];
          if (entry.layout.num_cols > 1) {
            tag_values.push(["colspan", entry.layout.num_cols.toString()]);
          }
          if (entry.layout.num_rows > 1) {
            tag_values.push(["rowspan", entry.layout.num_rows.toString()]);
          }
          const td = tr.add_ele("td", {}, tag_values);
          entry.create_div(album_gui, this.album, td, this.style);
        }
      }
    }
  }
}
