use std::rc::Rc;

#[derive(Debug, Default)]
pub struct StyleInner {
    pub parent: Option<Style>,
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
    pub num_rows: usize,
    pub num_cols: usize,
    pub lod: usize,
    pub pad: Option<usize>,
    pub bg: Option<String>,
    pub color: Option<String>,
    pub border: Option<String>,
    pub font: Option<String>,
}

#[derive(Debug, Default)]
pub struct Style(Rc<StyleInner>);

macro_rules! with_value {
    ($f:ident, $s:ident, $t:ty) => {
        pub fn $f(&self) -> &$t {
            &self.0.$f
        }
        pub fn $s(mut self, value: $t) -> Self {
            Rc::get_mut(&mut self.0).unwrap().$f = value;
            self
        }
    };
}

impl Style {
    with_value!(x, with_x, u32);
    with_value!(y, with_y, u32);
    with_value!(width, with_width, u32);
    with_value!(height, with_height, u32);
    with_value!(num_rows, with_num_rows, usize);
    with_value!(num_cols, with_num_cols, usize);
    with_value!(lod, with_lod, usize);
    with_value!(pad, with_pad, Option<usize>);
    with_value!(bg, with_bg, Option<String>);
    with_value!(color, with_color, Option<String>);
    with_value!(border, with_border, Option<String>);
    with_value!(font, with_font, Option<String>);
}
