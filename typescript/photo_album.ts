import photo_album_init from "../wasm/photo_album.js";
// import * as photo_album_wasm from "../wasm/photo_album.js";

import { Tabs } from "./tabs.js";

import { Application } from "./application.js";
import { Album, AlbumGui } from "./album.js";
import { HtmlElement } from "./html.js";

import { make_album } from "./example_album.js";

class PhotoAlbumApplication extends Application {
  photo_album: PhotoAlbum | null = null;
  album_creation: () => Album;
  constructor(album_creation: () => Album) {
    super([photo_album_init]);
    this.album_creation = album_creation;
  }

  override application_init() {
    this.photo_album = new PhotoAlbum(this.application_search_params, this.album_creation);
  }
}

class PhotoAlbum implements AlbumGui {
  tabs: Tabs<number>;
  album: Album;
  album_div: HtmlElement;
  pages: string[] = [];
  constructor(search_params:URLSearchParams, album_creation: () => Album) {

    console.log(search_params);

    this.tabs = new Tabs("tab-list", this.tab_select.bind(this), []);
    this.tabs.add_tab("album", "Album", 0);

    this.album = album_creation();
    this.album_div = new HtmlElement(document.getElementById("album_content")!);
    this.album_set_default_page();

    this.tabs.add_action("Previous", this.album_set_previous_page.bind(this))
    this.tabs.add_action("Top", this.album_set_default_page.bind(this))
    this.tabs.select("album");
  }

  tab_select(tag: number, tab: string) {
    console.log(tag, tab);
  }
  album_set_default_page() {
    this.album_set_page(this.album.default_page);
  }
  album_set_previous_page() {
    this.pages.pop();
    const prev_tag = this.pages.pop();
    if (prev_tag !== undefined) {
      this.album_set_page(prev_tag);
    } else {
      this.album_set_default_page();
    }
  }
  album_set_page(page_tag: string) {
    const page = this.album.get_page(page_tag);
    this.pages.push(page_tag);
    page!.mk_body(this, this.album_div);
  }
}

(window as any).application = new PhotoAlbumApplication(make_album);
