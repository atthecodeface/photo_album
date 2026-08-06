import photo_album_init from "../wasm/photo_album.js";
// import * as photo_album_wasm from "../wasm/photo_album.js";

import { Tabs } from "./tabs.js";

import { Application } from "./application.js";
import { Album, AlbumGui } from "./album.js";
import { AlbumTab } from "./album_tab.js";
import { ThumbnailsTab } from "./thumbnails_tab.js";
import { HtmlElement } from "./html.js";

export interface Tab {
  tab_select(): void;
  tab_deselect(): void;
  tab_set_search(hash_search:string): void;
}

class PhotoAlbumApplication extends Application {
  photo_album: PhotoAlbum | null = null;

  constructor() {
    super([photo_album_init]);
  }

  override application_init() {
    this.photo_album = new PhotoAlbum(
      this.application_location,
    );
  }
}

class PhotoAlbum implements AlbumGui {
  tabs: Tabs<Tab>;
  album: Album;
  album_tab: AlbumTab;
  thumbnails_tab: ThumbnailsTab;
  pages: string[] = [];
  view_selector: string;
  constructor(location: Location) {
    console.log("Created PhotoAlbum with search of:", location);

    this.album = new Album();

    const album_div = new HtmlElement(document.getElementById("album_content")!);
    this.album_tab = new AlbumTab(this.album, album_div);

    const thumbnail_div = new HtmlElement(document.getElementById("thumbnail_content")!);
    this.thumbnails_tab = new ThumbnailsTab(this.album, thumbnail_div);

    this.tabs = new Tabs("tab-list", this.tab_select.bind(this), []);
    this.tabs.add_tab("album", "Album", this.album_tab);
    this.tabs.add_tab("thumbnails", "Thumbnails", this.thumbnails_tab);

    // this.tabs.add_action("Previous", this.album_set_previous_page.bind(this));
    this.tabs.add_action("Top", () => { this.album_set_select("") }, "#album");

    window.addEventListener("hashchange", this.hash_changed.bind(this));

    const decode = this.decode_hash(location.hash);
    if (decode[0] !== "") {
      this.tabs.select(decode[0]);
    }
    this.view_selector = decode[1];

    const uri = "photo_album.json";
    this.fetch_json(uri)
      .then(
        this.album_add_json.bind(this)
      );
  }

  hash_changed(event: HashChangeEvent) {
    const decode = this.decode_hash(event.newURL);
    console.log("hash_changed:", decode[0], decode[1]);
    if (decode[0] !== "") {
      this.tabs.select(decode[0]);
    }
    this.album_tab.tab_set_search(decode[1]);
  }

  decode_hash(hash: string | undefined): [string, string] {
    let tab_to_select = "album";
    hash = hash!.split("#", 2)[1];
    if (hash !== undefined) {
      tab_to_select = hash.split("?")[0]!;
    } else {
      hash = "";
    }
    let search = hash.split("?", 2)[1];
    if (search === undefined) {
      search = "";
    }
    console.log(hash, tab_to_select, search);
    return [tab_to_select, search];
  }

  /**
   * Add an AlbumDesc JSON to the album loaded; ideally there is only one
   *
   * @param json Json fetched that should contain and AlbumDesc
   */
  album_add_json(json: any):void {
    try {
      this.album.of_desc(this, json);
      this.album_tab.tab_set_search(this.view_selector);
      const tab_name = this.tabs.selected_tab();
      const tab = this.tabs.tab(tab_name)!;
      this.tab_select(tab, tab_name);
    }
    catch (e) {
      alert(`Failed to read album json: ${e}`);
    }
  }

  /**
   * Get a promise resulting from the fetch the JSON for an AlbumDesc
   *
   * @param uri URI to fetch the AlbumDesc JSON from
   * @returns A promise which should contain the JSON
   */
  async fetch_json(uri:string): Promise<any> {
      return fetch(uri)
          .then((response) => {
              if (!response.ok) {
                  throw new Error(`Failed to fetch ${uri}: ${response.status}`);
              }
              return response.json();
          })
  }

  tab_select(tab: Tab, _tab_name: string) {
    tab.tab_select();
  }

  album_set_select(select: string): void {
    console.log("album_set_select:", select);
    this.album_tab.tab_set_search(select);
  }

}

(window as any).application = new PhotoAlbumApplication();
