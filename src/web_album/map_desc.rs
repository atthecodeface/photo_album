use serde::Serialize;

use super::AlbumDescBuilder;

use crate::album::Map;

#[derive(Debug, Default, Serialize)]
pub struct AlbumMapDesc {
    tag: String,
    caption: String,
    image: Option<String>,
    corners: [f64; 8],
}

impl AlbumMapDesc {
    pub fn of_map(album_desc: &AlbumDescBuilder, tag: &str, map: &Map) -> Self {
        let mut desc = Self::default();
        desc.tag = tag.to_owned();
        desc.caption = map.caption().into();
        desc.image = album_desc
            .album()
            .image(map.image())
            .map(|p| p.name().to_owned());
        desc
    }
}
