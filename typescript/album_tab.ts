import { HtmlElement } from "./html.js";

import { AlbumImage } from "./album_image.js";
import { AlbumPage } from "./album_page.js";
import { Album } from "./album.js";
import { Tab } from "./photo_album.js";

interface AlbumView {
  fill_div(div: HtmlElement): void;
}
export class AlbumViewPage implements AlbumView {
  page: AlbumPage | null = null;
  constructor() {}
  set_page(album: Album, page: string) {
    if (page == "") {
      page = album.default_page;
    }
    this.page = album.get_page(page);
  }
  fill_div(div: HtmlElement): void {
    if (this.page !== null) {
      this.page.mk_body(div);
    }
  }
}

export class AlbumViewImage implements AlbumView {
  image: AlbumImage;
  lod: number;
  constructor(image: AlbumImage, lod: number) {
    this.image = image;
    this.lod = lod;
  }

  fill_div(div: HtmlElement): void {
    this.image.mk_body(div, this.lod);
  }
}

export class AlbumTab implements Tab {
  album: Album;
  contents: AlbumView;
  div: HtmlElement;
  constructor(album: Album, div: HtmlElement) {
    this.album = album;
    this.div = div;
    this.div.clear();
    this.contents = new AlbumViewPage();
  }
  tab_deselect(): void {
  }
  tab_select(): void {
  }
  tab_set_search(hash_search: string): void {
    let view_page = new AlbumViewPage();
    view_page.set_page(this.album, "");
    let view: AlbumView = view_page;

    const arg_map = new Map();
    for (const arg of hash_search.split("&")) {
      const arg_split = arg.split("=", 2);
      if (arg_split.length == 2) {
        arg_map.set(arg_split[0], arg_split[1]);
      }
    }
    const page = arg_map.get("page");
    const image_name = arg_map.get("image");
    const lod_string = arg_map.get("lod");
    if (page !== undefined) {
      view_page.set_page(this.album, page);
    }
    if (image_name !== undefined) {
      const image = this.album.get_image(image_name);
      if (image !== null) {
        let lod = 0;
        if (lod_string !== undefined) {
          lod = parseInt(lod_string);
        }
        view = new AlbumViewImage(image, lod);
      }
    }
    this.contents = view;
    this.div.clear();
    this.contents.fill_div(this.div);
  }
}
