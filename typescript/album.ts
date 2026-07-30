import { AlbumImage } from "./album_image.js";
import { AlbumPage } from "./album_page.js";

export interface AlbumGui {
  album_set_page(tag: string): void;
}

export class Album {
  default_page: string;
  entries: Map<string, (AlbumImage | AlbumPage)>;
  img_rel_dir: string;

    constructor( img_rel_dir="") {
      this.entries = new Map();
      this.img_rel_dir = img_rel_dir;
      this.default_page = "";
    }

      img_filename(filename:string) {
      return this.img_rel_dir + filename;
    }

  add_image(tag: string, filename: string, caption: string, width_px: number, height_px: number, hi_res: string | null = null) {
    let hi_res_img : AlbumImage | null = null;
    if (hi_res !== null) {
      hi_res_img = this.get_image(hi_res);
    }
    const image = new AlbumImage(filename, caption, width_px, height_px, hi_res_img);
    this.entries.set(tag, image);
  }

       get_image(tag: string): AlbumImage | null  {
         const e = this.entries.get(tag);
         if (e instanceof AlbumImage) {
           return e;
         } else { return null; }
       }

       get_page(tag: string): AlbumPage | null  {
         const e = this.entries.get(tag);
         if (e instanceof AlbumPage) {
           return e;
         } else { return null; }
       }

  add_page(page: AlbumPage) {
    this.entries.set(page.tag, page);
  }
}
