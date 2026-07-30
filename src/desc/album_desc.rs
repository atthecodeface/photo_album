use serde::{Deserialize, Serialize};

use super::Error;
use super::{ImageDesc, PageDesc};
use crate::{Album, PathSet};

#[derive(Debug, Serialize, Deserialize)]
pub struct AlbumDesc {
    image_src_dir: Vec<String>,
    #[serde(default)]
    images: Vec<ImageDesc>,
    #[serde(default)]
    pages: Vec<PageDesc>,
    #[serde(default)]
    lod: Vec<f32>,
}

impl AlbumDesc {
    pub fn to_album(self, path_set: &PathSet) -> Result<Album, Error> {
        let mut album = Album::new(path_set);
        for l in self.lod {
            album.add_lod(l)?;
        }
        for isd in self.image_src_dir {
            album.add_image_src(&isd)?;
        }
        for i in self.images {
            let i = i.to_image(&mut album)?;
            album.add_image(i)?;
        }
        for p in self.pages {
            let p = p.to_page(&mut album)?;
            album.add_page(p)?;
        }
        Ok(album)
    }
}
