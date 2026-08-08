use photo_album_core::{Album, PathSet};

use photo_album_core::desc as photo_album_desc;
use photo_album_web as web_album_desc;

// use serde_yaml;

use thunderclap::{ArgCount, ArgDescriptor, CmdDescriptor, CommandArgs, json};

#[derive(Default, Debug)]
pub struct PhotoAlbumCommand {
    verbose: bool,
    pretty_json: bool,

    file_path_set: PathSet,

    read_filename: Option<String>,
    write_filename: Option<String>,
    album: Album,

    // Positional string / f64 / usize arguments
    arg_strings: Vec<String>,
    arg_f64s: Vec<f64>,
    arg_usizes: Vec<usize>,
}

type Error = photo_album_core::Error;
type PACResult<T> = std::result::Result<T, Error>;
type PACCmdResult = PACResult<json::Value>;

impl CommandArgs for PhotoAlbumCommand {
    type Error = Error;
    type Value = json::Value;
    const PROPERTIES: &[thunderclap::CmdProperty<'static, Self, Self::Value, Self::Error>] = &[];
    fn value_from_str(s: &str) -> PACCmdResult {
        if let Ok(v) = serde_json::from_str::<Self::Value>(s) {
            return Ok(v);
        }
        let v = serde_json::to_value(s)?;
        Ok(v)
    }
    fn cmd_ok() -> PACCmdResult {
        Ok("".into())
    }
    fn reset_args(&mut self) {
        self.read_filename = None;
        self.arg_strings.clear();
        self.arg_f64s.clear();
        self.arg_usizes.clear();
    }
}

impl PhotoAlbumCommand {
    fn if_verbose<F>(&self, f: F)
    where
        F: FnOnce(),
    {
        if self.verbose {
            f()
        }
    }
    pub fn verbose(&self) -> bool {
        self.verbose
    }
    pub fn pretty_json(&self) -> bool {
        self.pretty_json
    }
    pub fn read_filename(&self) -> Option<&str> {
        self.read_filename.as_deref()
    }
    pub fn write_filename(&self) -> Option<&str> {
        self.write_filename.as_deref()
    }

    const ARG_VERBOSE: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_flag(
        "verbose",
        Some('v'),
        "Enable verbose output",
        &|cmd: &mut PhotoAlbumCommand, verbose| {
            cmd.verbose = verbose;
            Ok(())
        },
    );

    const ARG_PRETTY_JSON: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_flag(
        "pretty_json",
        Some('p'),
        "Enable pretty JSON output",
        &|cmd: &mut PhotoAlbumCommand, pretty_json| {
            cmd.pretty_json = pretty_json;
            Ok(())
        },
    );

    const ARG_READ_FILENAME: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_string(
        "album_desc_file",
        Some('f'),
        "Album descriptor filename",
        ArgCount::Optional,
        None,
        &|cmd: &mut PhotoAlbumCommand, filename| {
            cmd.read_filename = Some(filename.to_owned());
            Ok(())
        },
    );

    const ARG_WRITE_FILENAME: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_string(
        "write_desc_file",
        Some('w'),
        "Album descriptor output filename",
        ArgCount::Optional,
        None,
        &|cmd: &mut PhotoAlbumCommand, filename| {
            cmd.write_filename = Some(filename.to_owned());
            Ok(())
        },
    );

    const ARG_CLEAR_FILE_PATH: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_flag(
        "clear_file_path",
        None,
        "Clear the file path",
        &|cmd: &mut PhotoAlbumCommand, _s| {
            cmd.file_path_set.clear();
            Ok(())
        },
    );

    const ARG_ADD_FILE_PATH: ArgDescriptor<PhotoAlbumCommand> = ArgDescriptor::arg_string(
        "file_path",
        Some('P'),
        "Add a file path to the path set",
        ArgCount::Any,
        None,
        &|cmd: &mut PhotoAlbumCommand, s| {
            cmd.file_path_set.add_path(s)?;
            Ok(())
        },
    );

    const SCALE_IMAGES_CMD: CmdDescriptor<Self> = CmdDescriptor::new("scale_images")
        .about("scale the images and write to the output directory")
        .args(&[])
        .handler(&Self::scale_images)
        .cmds(&[]);

    const WEB_CMD: CmdDescriptor<Self> = CmdDescriptor::new("web")
        .about("web JSON creation")
        .args(&[Self::ARG_WRITE_FILENAME])
        .handler(&Self::web)
        .cmds(&[]);

    const BASE_CMD: CmdDescriptor<Self> = CmdDescriptor::new("photo_album")
        .about("Photo album creator")
        .version("0.1.0")
        .args(&[
            Self::ARG_VERBOSE,
            Self::ARG_PRETTY_JSON,
            Self::ARG_CLEAR_FILE_PATH,
            Self::ARG_ADD_FILE_PATH,
            Self::ARG_READ_FILENAME,
        ])
        .handler(&Self::main)
        .cmds(&[Self::SCALE_IMAGES_CMD, Self::WEB_CMD]);

    fn read_album(&mut self) -> PACResult<()> {
        let Some(f) = self.read_filename() else {
            return Ok(());
        };
        let r = std::fs::File::open(f)?;
        let desc = serde_yaml::from_reader::<_, photo_album_desc::AlbumDesc>(r)?;
        self.album = desc.to_album(&self.file_path_set)?;
        self.album.derive_data()?;
        Ok(())
    }

    pub fn scale_images(&mut self) -> PACCmdResult {
        self.read_album()?;
        for img in self.album.images() {
            let rgb_image = img.read_img()?;
            for img_data in img.image_data() {
                let Some(path) = img_data.image_file() else {
                    continue;
                };
                let lod = img_data.lod();
                eprintln!("HERE {}", path.display());
                if path.exists() {
                    continue;
                }
                if lod.is_unscaled() {
                    std::fs::copy(img.src(), path)?;
                } else {
                    let w = img_data.width();
                    let h = img_data.height();
                    let resized_image = image::imageops::resize(
                        &rgb_image,
                        w,
                        h,
                        image::imageops::FilterType::CatmullRom,
                    );
                    resized_image.save(path).map_err(|e| {
                        let e: Error = e.into();
                        e
                    })?;
                }
            }
        }
        Self::cmd_ok()
    }

    pub fn web(&mut self) -> PACCmdResult {
        self.read_album()?;
        let web_album = web_album_desc::AlbumDesc::of_album(&self.album);
        if let Some(write_filename) = self.write_filename() {
            use std::io::Write;
            let mut f = std::fs::File::create(write_filename)?;
            writeln!(f, "{}", web_album.to_json(self.pretty_json())?)?;
        }
        Ok(json::to_value(web_album)?)
    }

    pub fn main(&mut self) -> PACCmdResult {
        let s = self.read_album()?;
        eprintln!("{s:?}");
        Self::cmd_ok()
    }
}

pub fn main() -> Result<(), Box<dyn std::error::Error>> {
    let build = PhotoAlbumCommand::BASE_CMD.build();
    let mut cmd_args = PhotoAlbumCommand::default();
    let mut command = build.main(true, true);
    command.execute_env(&mut cmd_args)?;
    Ok(())
}
