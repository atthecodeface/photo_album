import { AlbumDesc } from "./album_desc.js";
import { AlbumImage } from "./album_image.js";
import { AlbumPage } from "./album_page.js";

export interface AlbumGui {
  album: Album;
  album_set_select(select: string): void;
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

  of_desc(album_gui: AlbumGui, desc: AlbumDesc) {
    if (desc.default_page !== undefined) {
      this.default_page = desc.default_page;
    }
    if (desc.img_rel_dir !== undefined) {
      this.img_rel_dir = desc.img_rel_dir;
    }
    if (desc.images !== undefined) {
      for (const id of desc.images) {
        const image = AlbumImage.of_desc(this, id);
        this.entries.set(image.tag(), image);
      }
    }
    if (desc.pages !== undefined) {
      for (const pd of desc.pages) {
        const page = AlbumPage.of_desc(album_gui, pd);
        this.entries.set(page.tag(), page);
      }
    }
  }
  min_img_lod(): number { return 1_000_000; }
  img_filename(filename: string) {
    return this.img_rel_dir + filename;
  }

  image_tags(): string[] {
    let images = [];
    for (const e of this.entries.entries()) {
      const tag = e[0]!;
      const entry = e[1]!;
      if (entry instanceof AlbumImage) {
        images.push(tag);
      }
    }
    return images;
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
