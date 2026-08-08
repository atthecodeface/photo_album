import { WasmMat4f32, WasmQuatf32 } from "../wasm/photo_album.js";

import { HtmlElement }  from "./html.js";
import { Log } from "./log.js";
import * as mouse from "./mouse.js";

import * as web_gl from "./web_gl.js";
import * as web_gl_3d_obj from "./web_gl_3d_obj.js";
import * as web_gl_pt_field from "./web_gl_pt_field.js";

export class WebglCanvas implements mouse.MouseClient {
  webgl: web_gl.Webgl;
  mouse: mouse.Mouse;

  div: HtmlElement;
  resizable_box: HTMLDivElement;

  resize_observer: ResizeObserver;
  width: number = 40;
  height: number = 40;

  simple_program: number;
  pt_field_program: number;

  pt_field: web_gl_pt_field.WebglPtFieldObj;
  octa: web_gl_3d_obj.Webgl3DObj;

  camera: WasmQuatf32;
  fov: number = 1.0;
  drag_is_rotate: boolean = false;

  octa_texture: web_gl.WebglTexture | null = null;
  octa_image_filename: string = "panoramas/st_albans_distant_oct.jpg";
  view_matrix: WasmMat4f32;

  constructor(logger: Log, div: HtmlElement) {
    this.camera = WasmQuatf32.unit();
    this.camera.set_premul_rotate_z(-3.1415926538 / 2.0);
    this.div = div;
    this.resize_observer = new ResizeObserver(this.resize_event.bind(this));
    this.resizable_box = document.getElementsByClassName(
      "get_size_of_this",
     )![0]! as HTMLDivElement;
    this.resize_observer.observe(this.resizable_box);

    const canvas = div.add_ele("canvas");

    this.view_matrix = WasmMat4f32.identity();
    this.mouse = new mouse.Mouse(this, canvas.ele);

    this.webgl = new web_gl.Webgl(logger, canvas.ele as HTMLCanvasElement);
    this.webgl.start_webgl();
    {
      this.simple_program = this.webgl.compile_program(
        new web_gl_3d_obj.Webgl3DObjSimpleShader(),
      )!;
      this.pt_field_program = this.webgl!.compile_program(
        new web_gl_pt_field.WebglPtFieldShader(),
      )!;

      this.octa = web_gl_3d_obj.Webgl3DObj.octahedron(1, 1 / 1024.0); // For 256-by-256 square patches, vertices should be on center of texture pixels

      /** pt_field sphere random surface uses nx=10000, ny=10000, nz=1, pt_weight 1, size_range whatever, is_sphere true */
      /** pt_field square random surface uses nx=10000, ny=10000, nz=1, pt_weight 1, size_range whatever, is_sphere false */
      /** pt_field cube random volume uses nx=1000, ny=1000, nz=1000, pt_weight 1, size_range whatever, is_sphere false */
      /** pt_field cube grid volume uses nx=20, ny=20, nz=20, pt_weight 1, size_range whatever, is_sphere false */
      // this.pt_field = new web_gl_pt_field.WebglPtFieldObj(8000, 20, 20, 20)
      this.pt_field = new web_gl_pt_field.WebglPtFieldObj(
        8000,
        2000,
        2000,
        2000,
      )
        .set_pt_random_weight(1.0)
        //.set_field_kind(web_gl_pt_field.WebglPtFieldKind.Sphere)
        .set_field_kind(web_gl_pt_field.WebglPtFieldKind.CubeSurface)
        .set_size_range(1, 3);

      //this.pt_field.is_sphere = true;

      this.webgl.create(this.pt_field);
      this.webgl.create(this.octa);

      this.octa_texture = new web_gl.WebglTexture(this.webgl, new Image());
      this.octa_texture.image!.src = this.octa_image_filename;
    }

    const pt_field_ctls = new HtmlElement(
      document.getElementById("pt_field_ctls")!,
    );
    pt_field_ctls.add_input_range(
      "pt_field_num_pts",
      { min: 1, max: 10000 },
      this.pt_field_set_num_pts.bind(this),
      {},
    );
    pt_field_ctls.add_input_range(
      "pt_field_nx",
      { min: 1, max: 100 },
      this.pt_field_set_nx.bind(this),
      {},
    );
    pt_field_ctls.add_input_range(
      "pt_field_ny",
      { min: 1, max: 100 },
      this.pt_field_set_ny.bind(this),
      {},
    );
    pt_field_ctls.add_input_range(
      "pt_field_nz",
      { min: 1, max: 100 },
      this.pt_field_set_nz.bind(this),
      {},
    );
    pt_field_ctls.add_input_range(
      "pt_field_style",
      { min: 0, max: 15 },
      this.pt_field_set_style.bind(this),
      {},
    );
    pt_field_ctls.add_input_range(
      "pt_random_weight",
      { min: 0, max: 1.0, step: 0.01 },
      this.pt_field_set_random_weight.bind(this),
      {},
    );

  }

  pt_field_set_num_pts(_event: Event, value: number): void {
    this.pt_field.set_num_points(value);
    this.redraw();
  }

  pt_field_set_nx(_event: Event, value: number): void {
    this.pt_field.set_dims(value, this.pt_field.ny, this.pt_field.nz);
    this.redraw();
  }

  pt_field_set_ny(_event: Event, value: number): void {
    this.pt_field.set_dims(this.pt_field.nx, value, this.pt_field.nz);
    this.redraw();
  }

  pt_field_set_nz(_event: Event, value: number): void {
    this.pt_field.set_dims(this.pt_field.nx, this.pt_field.ny, value);
    this.redraw();
  }

  pt_field_set_style(_event: Event, value: number): void {
    this.pt_field.set_field_kind(value);
    this.redraw();
  }

  pt_field_set_random_weight(_event: Event, value: number): void {
    this.pt_field.set_pt_random_weight(value);
    this.redraw();
  }

  resize_event(_e: ResizeObserverEntry[]): void {
    const width = this.resizable_box.offsetWidth;
    const height = this.resizable_box.offsetHeight;

    this.webgl.canvas.width = width;
    this.webgl.canvas.height = height;

    this.width = width;
    this.height = height;
  }

  redraw_common(webgl: web_gl.Webgl): void {
    this.camera.mat4_set_rotation(this.view_matrix);
    webgl.set_projection_perspective(
      this.fov,
      webgl.canvas.width / webgl.canvas.height,
      0.05,
      15.0,
    );
  }

  redraw_pt_field(webgl: web_gl.Webgl): void {
    this.redraw_common(webgl);
    const view_matrix = this.view_matrix.array;

    webgl.use_program(this.pt_field_program);
    webgl.set_uniform_projection();
    webgl.set_uniform_mat4(web_gl.WebglUniform.View, view_matrix, true);
    webgl.set_uniform_mat4(web_gl.WebglUniform.Model, webgl.identity);
    webgl.draw(this.pt_field!);
  }

  redraw_octa(webgl: web_gl.Webgl): void {
    webgl.use_program(this.simple_program);
    webgl.set_color([0.5, 1, 0.2, 1]);
    if (this.octa_texture !== null) {
      webgl.set_texture(this.octa_texture);
    }

    this.redraw_common(webgl);
    const view_matrix = this.view_matrix.array;
    const view_matrix_at_origin = new Float32Array(16);
    view_matrix_at_origin.set(view_matrix);
    view_matrix_at_origin[3] = 0;
    view_matrix_at_origin[7] = 0;
    view_matrix_at_origin[11] = 0;
    view_matrix_at_origin[12] = 0;
    view_matrix_at_origin[13] = 0;
    view_matrix_at_origin[14] = 0;
    webgl.set_uniform_projection();
    webgl.set_uniform_mat4(
      web_gl.WebglUniform.View,
      view_matrix_at_origin,
      true,
    );
    webgl.set_uniform_mat4(
      web_gl.WebglUniform.Model,
      [8, 0, 0, 0, 0, 8, 0, 0, 0, 0, 8, 0, 0, 0, 0, 1],
    );
    webgl.draw(this.octa);

    webgl.clear_depth_buffer();

    webgl.set_uniform_mat4(web_gl.WebglUniform.View, view_matrix, true);
    webgl.set_uniform_mat4(
      web_gl.WebglUniform.Model,
      [0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 1],
    );
    webgl.draw(this.octa);
  }

  redraw_all(webgl: web_gl.Webgl): void {
    this.redraw_octa(webgl);
    this.redraw_pt_field(webgl);
  }

  redraw(): void {
    // if (tab_redraw_fn !== null) {
    this.webgl.set_viewport();
    this.webgl.clear_buffer();
    this.redraw_all(this.webgl);
    //      tab_redraw_fn(this.webgl);
    // }
  }

  user_zoom(_xy: [number, number], factor: number): void {
    this.fov /= factor;
    this.fov = Math.min(Math.max(this.fov, 0.2), 4.0);
    this.redraw();
  }
  user_rotate(_xy: [number, number], _angle: number): void {}
  user_pan(_xy: [number, number], _dxy: [number, number]): void {}
  user_press(_xy: [number, number], _actions: mouse.MousePressActions): void {
  }
  user_press_move(_start_xy: [number, number], _xy: [number, number]): void {}
  user_press_cancel(_start_xy: [number, number]): void {}
  user_release(_start_xy: [number, number], _xy: [number, number]): void {}
  drag_start(start_xy: [number, number], _xy: [number, number]): void {
    const dx = start_xy[0] - this.width / 2;
    const dy = start_xy[1] - this.height / 2;
    const d = dx * dx + dy * dy;
    this.drag_is_rotate = (d > this.width * this.height / 6);
  }
  drag_to(
    _start_xy: [number, number],
    old_xy: [number, number],
    new_xy: [number, number],
  ): void {
    if (this.drag_is_rotate) {
      const da = Math.atan2(new_xy[1] - this.height / 2, new_xy[0] - this.width / 2) -
        Math.atan2(old_xy[1] - this.height / 2, old_xy[0] - this.width / 2);
      this.camera.set_premul_rotate_z(-da);

    } else {
    const dx = new_xy[0] - old_xy[0];
    const dy = new_xy[1] - old_xy[1];
    this.camera.set_premul_rotate_y(dx * this.fov*0.003);
      this.camera.set_premul_rotate_x(dy * this.fov * 0.003);
    }
    this.redraw();
  }
  // Drag (which started at start_xy) has finished at xy (which the last drag_to probably indicated)
  drag_end(_start_xy: [number, number], _xy: [number, number]): void {}
}
