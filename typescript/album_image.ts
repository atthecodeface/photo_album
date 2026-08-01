import { HtmlElement } from "./html.js";
import { Album } from "./album.js";

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
    width: number,
  ): HtmlElement {
    const e = parent.add_ele("img", {}, [
      ["src", album.img_filename(this.filename)],
    ]);
    e.set_styles([["width", `${width}px`]]);
    return e;
  }
}
