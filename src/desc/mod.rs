use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("failed to parse json {0}")]
    Json(#[from] serde_json::Error),
    #[error("io error {0}")]
    Io(#[from] std::io::Error),
    #[error("album creation failed {0}")]
    Album(#[from] crate::album::Error),
}

mod album_desc;
mod image_desc;
mod page_desc;
mod style_desc;

pub use album_desc::AlbumDesc;
pub use image_desc::ImageDesc;
pub use page_desc::PageDesc;
pub use style_desc::StyleDesc;
