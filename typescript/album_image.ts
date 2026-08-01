import { HtmlElement } from "./html.js";
import { Album, AlbumGui } from "./album.js";
import { AlbumStyle } from "./album_style.js";

export interface AlbumImageDesc {
  tag?: string;
  filename?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export class AlbumImage {
  _tag: string;
  filename: string;
  caption: string;
  width: number;
  height: number;
  hi_res: AlbumImage | null;

  constructor(
    tag: string,
    filename: string,
    caption: string,
    width: number,
    height: number,
    hi_res: AlbumImage | null = null,
  ) {
    this._tag = tag;
    this.filename = filename;
    this.caption = caption;
    this.width = width;
    this.height = height;
    this.hi_res = hi_res;
  }

  static of_json(
    _album: Album,
    {
      tag: t = "",
      filename: f = "<no filename given>",
      caption: c = "",
      width: w = 100,
      height: h = 100,
    }: AlbumImageDesc,
  ): AlbumImage {
    return new AlbumImage(t, f, c, w, h);
  }

  tag(): string {
    return this._tag;
  }
  create_img(
    album: Album,
    parent: HtmlElement,
    style: AlbumStyle,
  ): HtmlElement {
    const img_style = style.clone();
    img_style.w_px = this.width;
    img_style.h_px = this.height;
    const e = parent.add_ele("img", {}, [
      ["src", album.img_filename(this.filename)],
    ]);

    img_style.ele_style_attr(e, ["width"], this.width / this.height);
    return e;
  }

  create_div(
    _album_gui: AlbumGui,
    album: Album,
    td: HtmlElement,
    style: AlbumStyle,
  ) {
    const div = td.add_ele("div", {}, [["align", "center"]]);
    const href_filename = album.img_filename(this.filename);
    // if this.hi_res is not None:
    //            href_filename  = site.img_filename(this.hi_res.filename)
    //    pass
    const a = div.add_ele("a", {}, [["href", href_filename]]);
    style.ele_style_attr(a, ["color"]);
    this.create_img(album, a, style);
    if (this.caption !== null) {
      div.add_ele("p");
      const a = div.add_ele("a", { classes: "caption" }, [
        ["href", href_filename],
      ]);
      style.ele_style_attr(a, ["color"]);
      a.add_content(this.caption);
    }
    return div;
  }
}
