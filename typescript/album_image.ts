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

  static of_desc(
    {
      filename: filename = "<no filename given>",
      width: w = 100,
      height: h = 100,
      lod: lod = 0,
    }: AlbumImageDataDesc,
  ): AlbumImageLod {
    return new AlbumImageLod(filename, w, h, lod);
  }

}

export class AlbumImage {
  _tag: string;
  _image_data: AlbumImageLod[];
  _caption: string;

  constructor(
    tag: string,
    caption: string,
  ) {
    this._tag = tag;
    this._caption = caption;
    this._image_data = [];
  }

  static of_desc(
    _album: Album,
    {
      tag: t = "",
      caption: c = "",
      data: data = [],
    }: AlbumImageDesc,
  ): AlbumImage {
    const image = new AlbumImage(t, c);
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

  get_lod(lod: number, width: number): AlbumImageLod | null {
    if (this._image_data.length ==0) {
      return null;
    }
    for (const d of this._image_data) {
      if (d.lod === lod) { return d; }
    }
    for (const d of this._image_data) {
      if (d.width >= width) { return d; }
    }
    return this._image_data[0]!;
  }
}
