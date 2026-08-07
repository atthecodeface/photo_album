import { HtmlElement } from "./html.js";

import { Album } from "./album.js";
import { Tab } from "./photo_album.js";

export class ThumbnailsTab implements Tab {
  album: Album;
  div: HtmlElement;
  constructor(album: Album, div: HtmlElement) {
    this.album = album;
    this.div = div;
    this.div.clear();
  }
  tab_deselect(): void {}
  tab_select(): void {
    this.div.clear();

    const table = this.div.add_table();
    const image_tags = this.album.image_tags();
    image_tags.sort((a, b) => a.localeCompare(b));
    let n = image_tags.length;
    let nc = 8;
    if (n < 8) {
      nc = n;
    }
    const td_width = 800 / nc;
    let nr = Math.ceil(n / nc);
    for (let y = 0; y < nr; y++) {
      const row = [];
      for (let x = 0; x < nc; x++) {
        let i = x + y * nc;
        const tag = image_tags[i];
        if (tag !== undefined) {
          const img = this.album.get_image(tag)!;
          const td_div = this.div.add_ele("div");
          const img_lod = img.get_width(1);
          if (img_lod !== null) {
            row.push(img.create_img_link(td_div, img_lod, img_lod, td_width));
          }
        }
      }
      table.add_body(row);
    }
    table.as_html();
  }

  tab_set_search(_hash_search: string): void {}
}
