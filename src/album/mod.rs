use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("io error {0}")]
    Io(#[from] std::io::Error),
    #[error("image handling failed {0}")]
    Image(#[from] ::image::ImageError),
    #[error("album does not contain image {image_name}")]
    AlbumDoesNotContainImage { image_name: String },
    #[error("album does not contain page {page_name}")]
    AlbumDoesNotContainPage { page_name: String },
    #[error("{0}")]
    PathSet(#[from] crate::path_set::Error),
    #[error("level of detail must indicate 10k to 100Mpix (got {0})")]
    LevelOfDetailRange(usize),
}

mod album;
mod image;
mod page;
mod style;

pub use album::Album;
pub use image::{Image, ImageData};
pub use page::{Page, PageImage, PagePage};
pub use style::Style;
