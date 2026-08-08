use std::path::Path;

use serde::Serialize;

use super::{AlbumImageDesc, AlbumMapDesc, AlbumPageDesc};
use photo_album_core::{Album, Image, ImageData, Page, PageImage, PagePage};

#[derive(Debug, Default, Serialize)]
pub struct AlbumDesc {
    default_page: String,
    img_rel_dir: String,
    images: Vec<AlbumImageDesc>,
    maps: Vec<AlbumMapDesc>,
    pages: Vec<AlbumPageDesc>,
}

pub struct AlbumDescBuilder<'build> {
    album: &'build Album,
}

impl<'build> AlbumDescBuilder<'build> {
    pub fn desc_filename_of_filename(&self, filename: Option<&Path>) -> String {
        if let Some(filename) = filename {
            /*
            if filename.starts_with("output") {
                filename = filename.strip_prefix("output").unwrap();
            }
            */
            filename.as_os_str().to_str().unwrap_or("").to_owned()
        } else {
            "".into()
        }
    }
    pub fn album(&self) -> &Album {
        &self.album
    }
}

impl AlbumDesc {
    pub fn of_album(album: &Album) -> Self {
        let build = AlbumDescBuilder { album: album };
        let img_rel_dir = "../";
        let mut desc = Self::default();
        let mut image_tags: Vec<_> = album.image_tags().collect();
        image_tags.sort();
        for image_name in image_tags {
            // Must be able to find the image tag
            let i = album.find_image_index(image_name).unwrap();
            let i = album.image(i).unwrap();
            let image_desc = AlbumImageDesc::of_image(&build, image_name, i);
            desc.images.push(image_desc);
        }
        for map in album.maps() {
            // Must be able to find the page tag
            let map_desc = AlbumMapDesc::of_map(&build, map.name(), map);
            desc.maps.push(map_desc);
        }
        // Pages must be added in the order they exist, as they form a hierarchy and parents must come after leaves
        for page in album.pages() {
            // Must be able to find the page tag
            let page_desc = AlbumPageDesc::of_page(&build, page.name(), page);
            desc.pages.push(page_desc);
        }
        let default_page = album
            .pages()
            .last()
            .map(|a| a.name().to_owned())
            .unwrap_or_default();
        desc.default_page = default_page.into();
        desc.img_rel_dir = img_rel_dir.into();
        desc
    }
    /// Generate the json
    pub fn to_json(&self, pretty: bool) -> photo_album_core::Result<String> {
        if pretty {
            Ok(serde_json::to_string_pretty(self)?)
        } else {
            Ok(serde_json::to_string(self)?)
        }
    }
}
