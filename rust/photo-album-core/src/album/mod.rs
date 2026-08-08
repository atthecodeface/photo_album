use std::path::PathBuf;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("cannot find file {0}")]
    CannotFindFile(PathBuf),
    #[error("failed to open file {0}: {1}")]
    FailedToOpenImage(String, std::io::Error),
    #[error("image handling failed {0}")]
    Image(#[from] ::image::ImageError),
    #[error("cannot create output image path from {0}")]
    CannotCreateOutputImagePath(PathBuf),
    #[error("album already contains image {image_name}")]
    AlbumAlreadyContainsImage { image_name: String },
    #[error("album already contains map {map_name}")]
    AlbumAlreadyContainsMap { map_name: String },
    #[error("album does not contain image {image_name}")]
    AlbumDoesNotContainImage { image_name: String },
    #[error("album already contains image {page_name}")]
    AlbumAlreadyContainsPage { page_name: String },
    #[error("album does not contain page {page_name}")]
    AlbumDoesNotContainPage { page_name: String },
    #[error("{0}")]
    PathSet(#[from] crate::path_set::Error),
    #[error("level of detail must indicate 10k to 100Mpix (got {0})")]
    LevelOfDetailRange(usize),
}

impl std::convert::From<(&std::path::Path, std::io::Error)> for Error {
    fn from(value: (&std::path::Path, std::io::Error)) -> Self {
        let pathname = value.0.as_os_str().to_string_lossy().into();
        Self::FailedToOpenImage(pathname, value.1)
    }
}

mod lod;
pub use lod::Lod;

mod album;
mod image;
mod image_data;
mod map;
mod page;
mod style;

pub use album::{Album, ImageIndex, PageIndex};
pub use image::Image;
pub use image_data::ImageData;
pub use map::Map;
pub use page::{Page, PageImage, PagePage};
pub use style::Style;

#[derive(Debug, Default, Clone, Copy)]
pub struct LatLon {
    lat: f64,
    lon: f64,
}
