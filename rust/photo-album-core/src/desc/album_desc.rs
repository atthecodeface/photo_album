use serde::{Deserialize, Serialize};

use super::Error;
use super::{ImageDesc, MapDesc, PageDesc};
use crate::{Album, PathSet};

#[derive(Debug, Serialize, Deserialize)]
pub struct AlbumDesc {
    /// Directories where images may be found
    #[serde(default)]
    image_src_dir: Vec<String>,
    /// Image descriptors
    #[serde(default)]
    images: Vec<ImageDesc>,
    /// Map descriptors
    #[serde(default)]
    maps: Vec<MapDesc>,
    /// Page descriptors
    #[serde(default)]
    pages: Vec<PageDesc>,
    /// Image output directory (currently all must go in one directory)
    #[serde(default)]
    image_out_dir: String,
    /// Levels of detail of images to use
    ///
    /// The entries are in MPix (i.e. 1.0 is 1Mpix; thumbnails might be 0.1 to allow for e.g. 320x300)
    ///
    /// These can be in any order
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
        for m in self.maps {
            let m = m.to_map(&mut album)?;
            album.add_map(m)?;
        }
        for p in self.pages {
            let p = p.to_page(&mut album)?;
            album.add_page(p)?;
        }
        if !self.image_out_dir.is_empty() {
            album.set_output_root(&self.image_out_dir);
        }
        Ok(album)
    }
}
