import { HtmlElement } from "./html.js";

import { Album } from "./album.js";
import { AlbumImageDesc, AlbumImageDataDesc } from "./album_desc.js";

export class AlbumImageLod {
  filename: string;
  lod: number;
  width: number;
  height: number;
  constructor(
    filename: string,
    width: number,
    height: number,
    lod: number = 0,
  ) {
    this.filename = filename;
    this.lod = lod;
    this.width = width;
    this.height = height;
  }

  static of_desc({
    filename: filename = "<no filename given>",
    width: w = 100,
    height: h = 100,
    lod: lod = 0,
  }: AlbumImageDataDesc): AlbumImageLod {
    return new AlbumImageLod(filename, w, h, lod);
  }
}

export class AlbumImage {
  album: Album;
  _tag: string;
  _image_data: AlbumImageLod[];
  _caption: string;

  constructor(album: Album, tag: string, caption: string) {
    this.album = album;
    this._tag = tag;
    this._caption = caption;
    this._image_data = [];
  }

  static of_desc(
    album: Album,
    { tag: t = "", caption: c = "", data: data = [] }: AlbumImageDesc,
  ): AlbumImage {
    const image = new AlbumImage(album, t, c);
    for (const d of data) {
      image._image_data.push(AlbumImageLod.of_desc(d));
    }
    return image;
  }

  tag(): string {
    return this._tag;
  }

  caption(): string {
    return this._caption;
  }

  get_lod(min_lod: number): AlbumImageLod | null {
    if (this._image_data.length == 0) {
      return null;
    }
    if (min_lod != 0) {
      for (const d of this._image_data) {
        if ((d.lod !== 0) && (d.lod >= min_lod)) {
          return d;
        }
      }
    }
    for (const d of this._image_data) {
      if (d.lod==0) {
        return d;
      }
    }
    return this._image_data[0]!;
  }

  get_width(min_width: number): AlbumImageLod | null {
    if (this._image_data.length == 0) {
      return null;
    }
    for (const d of this._image_data) {
      if ((d.lod !== 0) && (d.width >= min_width)) {
        return d;
      }
    }
    return this.get_lod(0);
  }

  get_href(img_lod: AlbumImageLod): string {
    const select = "image=" + this.tag() + "&lod=" + img_lod.lod.toString();
    const href = "#album?" + select;
    return href;
  }

  create_img_tag(
    parent: HtmlElement,
    img_lod: AlbumImageLod,
    width: number = 0,
  ): HtmlElement {
    const e = parent.add_ele("img", {}, [
      ["src", this.album.img_filename(img_lod.filename)],
    ]);
    if (width != 0) {
      e.set_styles([["width", `${width}px`]]);
    }
    return e;
  }

  create_img_link(
    parent: HtmlElement,
    img_lod: AlbumImageLod,
    link_lod: AlbumImageLod,
    width: number,
  ): HtmlElement {
    const href = this.get_href(link_lod);
    const a = parent.add_ele("a", {}, [["href", href]]);
    this.create_img_tag(a, img_lod, width);
    return a;
  }

  mk_body(parent: HtmlElement, lod: number) {
    if ((lod !== 0) && (lod < this.album.min_img_lod())) {
      lod = this.album.min_img_lod();
      console.log("Set lod to ", lod);
    }
    let img_lod = this.get_lod(lod);
    if (img_lod !== null) {
      if (lod == 0) {
        this.create_img_link(parent, img_lod, img_lod, 0);
      } else {
        let next_img_lod = this.get_lod(img_lod.lod + 1);
         this.create_img_link(parent, img_lod, next_img_lod!, 0);
      }
    }
  }
}
