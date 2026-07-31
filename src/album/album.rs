use std::path::Path;
use std::path::PathBuf;
use std::str::FromStr;

use super::{Error, Image, Page};
use crate::PathSet;
use crate::indexed::VecWithIndex;

crate::make_index!(ImageIndex, usize, true);
crate::make_index!(PageIndex, usize, true);

#[derive(Debug, Default)]
pub struct Album {
    path_set: PathSet,
    /// Source directories for the images
    image_srcs: Vec<PathBuf>,
    images: VecWithIndex<'static, String, ImageIndex, Image, true>,
    pages: VecWithIndex<'static, String, PageIndex, Page, true>,
    lod: Vec<usize>,
}

impl Album {
    pub fn new(path_set: &PathSet) -> Self {
        let mut s = Self::default();
        s.path_set = path_set.clone();
        s
    }
    pub fn add_lod(&mut self, lod: f32) -> Result<(), Error> {
        let lod = (lod * 1_000_000.0) as usize;
        if lod < 10_000 || lod > 100_000_000 {
            return Err(Error::LevelOfDetailRange(lod));
        }
        self.lod.push(lod);
        self.lod.sort();
        Ok(())
    }
    pub fn find_image_path<P: AsRef<Path>>(&self, path: P) -> Result<PathBuf, Error> {
        Ok(self.path_set.find_file_err(path)?)
    }
    pub fn add_image_src(&mut self, s: &str) -> Result<(), Error> {
        let p = PathBuf::from_str(s).unwrap(); // The conversion is infallible
        self.image_srcs.push(p);
        Ok(())
    }

    pub fn add_image(&mut self, img: Image) -> Result<ImageIndex, Error> {
        let name = img.name().to_owned();
        let err_name = name.clone();
        self.images
            .insert(name, |_| img)
            .map_err(|_e| Error::AlbumAlreadyContainsImage {
                image_name: err_name,
            })
    }

    pub fn add_page(&mut self, page: Page) -> Result<PageIndex, Error> {
        let name = page.name().to_owned();
        let err_name = name.clone();
        self.pages
            .insert(name, |_| page)
            .map_err(|_e| Error::AlbumAlreadyContainsPage {
                page_name: err_name,
            })
    }

    pub fn find_image_index(&self, image_name: &str) -> Result<ImageIndex, Error> {
        if let Some(idx) = self.images.find_key(image_name) {
            Ok(idx)
        } else {
            Err(Error::AlbumDoesNotContainImage {
                image_name: image_name.to_owned(),
            })
        }
    }
    pub fn image(&self, idx: ImageIndex) -> Option<&Image> {
        self.images.get(idx)
    }

    pub fn find_page_index(&self, page_name: &str) -> Result<PageIndex, Error> {
        if let Some(idx) = self.pages.find_key(page_name) {
            Ok(idx)
        } else {
            Err(Error::AlbumDoesNotContainPage {
                page_name: page_name.to_owned(),
            })
        }
    }

    pub fn page(&self, idx: PageIndex) -> Option<&Page> {
        self.pages.get(idx)
    }

    pub fn make_page_indexes(&self) {
        for p in self.pages.iter() {
            p.make_page_index(&self);
        }
    }
}
