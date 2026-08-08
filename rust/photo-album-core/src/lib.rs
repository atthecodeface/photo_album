use thiserror::Error;

// mod wasm_lib;
// pub use wasm_lib::*;
// pub mod web_album;

pub mod path_set;
pub use path_set::PathSet;

#[derive(Error, Debug)]
pub enum Error {
    #[error("failed to parse json {0}")]
    Json(#[from] serde_json::Error),
    #[error("failed to parse yanl {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("io error {0}")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Album(#[from] album::Error),
    #[error("{0}")]
    Desc(#[from] desc::Error),
    #[error("{0}")]
    PathSet(#[from] path_set::Error),
    #[error("{0}")]
    String(String),
}

impl From<&str> for Error {
    fn from(value: &str) -> Self {
        Error::String(value.to_owned())
    }
}

pub type Result<T> = std::result::Result<T, Error>;

#[macro_use]
pub(crate) mod indexed;
// This enables indexed to use $crate :: Idx in its macro
pub(crate) use indexed::Idx;

pub mod album;
// pub mod dom;
pub mod desc;

pub use album::{Album, Image, Page, Style};
