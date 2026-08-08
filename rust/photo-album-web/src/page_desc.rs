use serde::Serialize;

use super::{AlbumDescBuilder, AlbumEntryDesc};
use photo_album_core::Page;

#[derive(Debug, Default, Serialize)]
pub struct AlbumPageDesc {
    tag: String,
    layout: String,
    title: String,
    entries: Vec<AlbumEntryDesc>,
}

impl AlbumPageDesc {
    pub fn of_page(album_desc: &AlbumDescBuilder, tag: &str, page: &Page) -> Self {
        let mut desc = Self::default();
        desc.tag = tag.to_owned();
        desc.layout = page.layout().to_owned();
        desc.title = page.title().to_owned();

        for pp in page.pages() {
            desc.entries
                .push(AlbumEntryDesc::of_page_page(album_desc, pp));
        }
        for ip in page.images() {
            desc.entries
                .push(AlbumEntryDesc::of_page_image(album_desc, ip));
        }
        desc
    }
}
