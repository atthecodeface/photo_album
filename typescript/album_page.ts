import { HtmlElement } from "./html.js";

import { Album, AlbumGui } from "./album.js";
import { AlbumImage } from "./album_image.js";
import { AlbumStyle } from "./album_style.js";

class Entry {
  num_cols: number;
  num_rows: number;
  img: AlbumImage;
  style: AlbumStyle;
  page: AlbumPage | null;

  constructor(num_cols: number,
  num_rows: number,
  img: AlbumImage,
  style: AlbumStyle,
  page: AlbumPage | null = null
  ) {
    this.num_cols = num_cols;
    this.num_rows = num_rows;
    this.img = img;
    this.style = style;
    this.page = page;
  }
  create_div(album_gui: AlbumGui, album: Album, parent: HtmlElement, style: AlbumStyle) {
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
  tag: string;

  num_columns: number = 0;
  num_rows: number = 0;

  // entries is a map from x+1000*y to the entry starting at (x,y)
  entries: Map<number, Entry>;
  rows_cols: Map<number, number[]>;

  // css
  css: string = `
           h1 { text-align: center;
                font-family: sans-serif;
                font-size: 40px;
            }
           div {text-align: center;
                font-family: serif;
                padding: 20px;
            }
           .caption {text-align: center;
                font-family: serif;
                font-size: 30px;
            }
           a:link {
             color: inherit;
           }
           a:visited {
             color: inherit;
           }
           table {
             color: inherit;
           }
           td {
             padding: 10px;
           }
    `;

  constructor(album: Album, tag: string, title: string, style: AlbumStyle = new AlbumStyle()) {
    this.album = album;
    this.tag = tag;
    this.style = style;
    this.title = title;
    this.heading = title;
    this.entries = new Map();
    this.rows_cols = new Map();
  }

  private add_entry(e: Entry, lx: number, ty: number, num_cols: number, num_rows: number) {

    this.entries.set(lx + 1000*ty, e);

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

  add_image(lx: number, ty: number, tag: string, style: AlbumStyle = new AlbumStyle(), num_cols: number = 1, num_rows: number = 1) {
    const img = this.album.get_image(tag);
    if (img === null) {
      throw new Error("Cannot find image " + tag + " in album");
    }
    const entry = new Entry(num_cols, num_rows, img, style);
    this.add_entry(entry, lx, ty, num_cols, num_rows);
  }

  add_page(lx: number, ty: number, tag: string, img_tag: string, style: AlbumStyle = new AlbumStyle(), num_cols: number = 1, num_rows: number = 1) {
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

  create_div(album_gui:AlbumGui, parent: HtmlElement, img: AlbumImage, style: AlbumStyle): HtmlElement {
    const div = parent.add_ele("div", {}, [["align", "center"]]);
    const href = "#select_this_page" + this.tag;
    style.ele_style_attr(div, ["color", "background", "pad", "border", "margin"]);
    const a = div.add_ele("a", {}, [["href", href]]);
    style.ele_style_attr(a, ["color"]);
    const this_tag = this.tag;
    a.ele.addEventListener("click", (_e) => album_gui.album_set_page(this_tag));
    img.create_img(this.album, a, style);
    if (this.title !== null) {
      div.add_ele("p");
      const a = div.add_ele("a", { classes: "caption" });
      style.ele_style_attr(a, ["color"]);
      a.ele.addEventListener("click", (_e) => album_gui.album_set_page(this_tag));
      a.add_content(this.title);
    }
    return div;
  }

  mk_body(album_gui:AlbumGui, html: HtmlElement) {
    html.clear();
    this.style.ele_style_attr(html, ["color", "background", "pad", "border", "margin"]);
    const table = html.add_ele("table")
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
        const entry = this.entries.get(x+y*1000);
        if (entry === undefined) {
          if (colspan > 1) {
            colspan = colspan - 1;
          } else {
            tr.add_ele("td", { classes:"filler" });
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
