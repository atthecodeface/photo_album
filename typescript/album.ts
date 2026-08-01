import { AlbumImage, AlbumImageDesc } from "./album_image.js";
import { AlbumPage, AlbumPageDesc } from "./album_page.js";

export interface AlbumGui {
  album_set_page(tag: string): void;
}

export interface AlbumDesc {
  default_page?: string;
  img_rel_dir?: string;
  images?: AlbumImageDesc[];
  pages?: AlbumPageDesc[];
}

export class Album {
  default_page: string;
  entries: Map<string, AlbumImage | AlbumPage>;
  img_rel_dir: string;

  constructor(img_rel_dir = "") {
    this.entries = new Map();
    this.img_rel_dir = img_rel_dir;
    this.default_page = "";
  }

  of_json(desc: AlbumDesc) {
    if (desc.default_page !== undefined) {
      this.default_page = desc.default_page;
    }
    if (desc.img_rel_dir !== undefined) {
      this.img_rel_dir = desc.img_rel_dir;
    }
    if (desc.images !== undefined) {
      for (const id of desc.images) {
        const image = AlbumImage.of_json(this, id);
        this.entries.set(image.tag(), image);
      }
    }
    if (desc.pages !== undefined) {
      for (const pd of desc.pages) {
        const page = AlbumPage.of_json(this, pd);
        this.entries.set(page.tag(), page);
      }
    }
  }

  img_filename(filename: string) {
    return this.img_rel_dir + filename;
  }

  add_image(
    tag: string,
    filename: string,
    caption: string,
    width_px: number,
    height_px: number,
    hi_res: string | null = null,
  ) {
    let hi_res_img: AlbumImage | null = null;
    if (hi_res !== null) {
      hi_res_img = this.get_image(hi_res);
    }
    const image = new AlbumImage(
      tag,
      filename,
      caption,
      width_px,
      height_px,
      hi_res_img,
    );
    this.entries.set(tag, image);
  }

  get_image(tag: string): AlbumImage | null {
    const e = this.entries.get(tag);
    if (e instanceof AlbumImage) {
      return e;
    } else {
      return null;
    }
  }

  get_page(tag: string): AlbumPage | null {
    const e = this.entries.get(tag);
    if (e instanceof AlbumPage) {
      return e;
    } else {
      return null;
    }
  }

  add_page(page: AlbumPage) {
    this.entries.set(page.tag(), page);
  }
}
