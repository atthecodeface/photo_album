#[derive(Debug, Default)]
pub struct Style {
    pub bg: String,
    pub color: String,
    pub width: u32,
    pub height: u32,
    pub num_rows: usize,
    pub num_cols: usize,
    pub x: u32,
    pub y: u32,
    pub lod: usize,
}
impl Style {}
