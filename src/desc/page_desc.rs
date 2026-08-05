use serde::{Deserialize, Serialize};

use super::Error;
use super::StyleDesc;
use crate::album::{Album, Page, PageImage, PagePage};

/// An image on a page
#[derive(Debug, Serialize, Deserialize)]
pub struct PageImageDesc {
    /// ImageDesc name of the image this refers to
    image: String,
    /// Caption to override with if any
    #[serde(default)]
    caption: String,
    /// Style
    #[serde(flatten)]
    style: StyleDesc,
}

impl PageImageDesc {
    pub fn to_page_image(self, album: &mut Album) -> Result<PageImage, Error> {
        let mut pgimg = PageImage::default();

        pgimg.set_image(album.find_image_index(&self.image)?);
        if self.caption.is_empty() {
            pgimg.set_caption(album.image(pgimg.image()).unwrap().caption());
        } else {
            pgimg.set_caption(self.caption);
        }
        pgimg.set_style(self.style.to_style()?);
        Ok(pgimg)
    }
}

/// A page reference on a page
#[derive(Debug, Serialize, Deserialize)]
pub struct PagePageDesc {
    /// PageDesc name that this links to
    page: String,
    /// Caption to override with if any
    #[serde(default)]
    caption: String,
    /// ImageDesc name to use
    image: String,
    /// Style
    #[serde(flatten)]
    style: StyleDesc,
}

impl PagePageDesc {
    pub fn to_page_page(self, album: &mut Album) -> Result<PagePage, Error> {
        let mut s = PagePage::default();
        s.set_page(album.find_page_index(&self.page)?);
        s.set_caption(self.caption);
        s.set_image(album.find_image_index(&self.image)?);
        s.set_style(self.style.to_style()?);
        Ok(s)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PageDesc {
    /// Name of the page description, unique within the site
    name: String,
    /// Title for the page
    title: String,
    /// Page entries within the table on the page
    #[serde(default)]
    pages: Vec<PagePageDesc>,
    /// Image entries within the table on the page
    #[serde(default)]
    images: Vec<PageImageDesc>,
    /// Style
    #[serde(flatten)]
    style: StyleDesc,
}

impl PageDesc {
    pub fn to_page(self, album: &mut Album) -> Result<Page, Error> {
        let mut page = Page::default();
        page.set_name(self.name);
        page.set_title(self.title);
        for i in self.images {
            let i = i.to_page_image(album)?;
            page.add_image(album, i)?;
        }
        for p in self.pages {
            let p = p.to_page_page(album)?;
            page.add_page(album, p)?;
        }
        page.set_style(self.style.to_style()?);

        Ok(page)
    }
}
