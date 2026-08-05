use super::{Album, Error, ImageIndex, PageIndex, Style};

#[derive(Debug, Default)]
pub struct PagePage {
    /// Page that this links to
    page: PageIndex,
    /// Caption to use
    caption: String,
    /// Image index of the image to use for this
    image: ImageIndex,
    /// Style
    style: Style,
}

impl PagePage {
    pub fn set_image(&mut self, image: ImageIndex) {
        self.image = image;
    }
    pub fn set_page(&mut self, page: PageIndex) {
        self.page = page;
    }
    pub fn set_caption<I: Into<String>>(&mut self, caption: I) {
        self.caption = caption.into();
    }
    pub fn set_style(&mut self, style: Style) {
        self.style = style;
    }
    pub fn style(&self) -> &Style {
        &self.style
    }
    pub fn caption(&self) -> &str {
        &self.caption
    }
    pub fn page(&self) -> PageIndex {
        self.page
    }
    pub fn image(&self) -> ImageIndex {
        self.image
    }
}

#[derive(Debug, Default)]
pub struct PageImage {
    /// ImageDesc index (in the site)
    image: ImageIndex,
    /// Caption to override with if any
    caption: String,
    /// Style
    style: Style,
}

impl PageImage {
    pub fn set_image(&mut self, image: ImageIndex) {
        self.image = image;
    }
    pub fn set_caption<I: Into<String>>(&mut self, caption: I) {
        self.caption = caption.into();
    }
    pub fn set_style(&mut self, style: Style) {
        self.style = style;
    }
    pub fn style(&self) -> &Style {
        &self.style
    }
    pub fn image(&self) -> ImageIndex {
        self.image
    }
    pub fn caption(&self) -> &str {
        &self.caption
    }
}

#[derive(Debug, Default)]
pub struct Page {
    /// Name of the page description, unique within the site
    name: String,
    /// Title for the page
    title: String,
    /// Page entries within the table on the page
    pages: Vec<PagePage>,
    /// Image entries within the table on the page
    images: Vec<PageImage>,
    /// Style
    style: Style,
}

impl Page {
    pub fn set_name<I: Into<String>>(&mut self, name: I) {
        self.name = name.into();
    }
    pub fn set_title<I: Into<String>>(&mut self, title: I) {
        self.title = title.into();
    }
    pub fn set_style(&mut self, style: Style) {
        self.style = style;
    }
    pub fn style(&self) -> &Style {
        &self.style
    }
    pub fn add_image(&mut self, _album: &mut Album, img: PageImage) -> Result<(), Error> {
        self.images.push(img);
        Ok(())
    }
    pub fn add_page(&mut self, _album: &mut Album, page: PagePage) -> Result<(), Error> {
        self.pages.push(page);
        Ok(())
    }
    pub fn name(&self) -> &str {
        &self.name
    }
    pub fn title(&self) -> &str {
        &self.title
    }
    pub fn pages(&self) -> &[PagePage] {
        &self.pages
    }
    pub fn images(&self) -> &[PageImage] {
        &self.images
    }
    pub fn make_page_index(&self, _album: &Album) {}
}
