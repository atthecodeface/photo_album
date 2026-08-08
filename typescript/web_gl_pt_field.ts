import { WebglShaderSrc, WebglObjKind, Webgl, WebglUniform } from "./web_gl.js";

const rand_u16_of_u24 = `
#line 1000
uint rand_u16_of_u24(uint u_n_24) {
    // sin(x * CONST + OTHER_CONST) is not a reversible mapping, and so takes 24 bits and reduce the entropy to fewer bits
    //
    // The following Rust algorithm has been tested for a degree of uniformity
    // and entropy spread, and appears to be okay, providing a 16-bit result
    //
    // let u_n_24 = i as u32;
    // let r_f = f32::from_bits(u_n_24 | 0x40_000000);
    // let r_m = r_f * 41931.73524 + 319.2918452;
    // let r_s = r_m.sin();
    // let u_r_24 = r_s.to_bits() & 0xffffff;
    // let u_r_16 = (u_r_24 + (u_r_24 >> 8)) as u16;

    // For u_n_24 top bit clear, f_rnd is ((u_n_24/2^24)+1/2) * 2^(128-127)) = 1 + (fractional bits / 2^23)
    // For u_n_24 top bit set, f_rnd is ((u_n_24/2^24)+1/2) * 2^(129-127)) = 2 + (fractional bits / 2^22)
    // So f_rnd is in the range [1, 4) using the full u_n_24 bits
    highp float r_f = uintBitsToFloat(u_n_24 | 0x40000000u);
    highp float r_s = sin(r_f* 41931.73524 + 319.2918452);
    uint u_r_24 = floatBitsToUint(r_f) & 0xffffffu;
    uint u_r_16 = (u_r_24 + (u_r_24 >> 8))  & 0xffffu;
    return u_r_16;
}
`;

export class WebglPtFieldShader implements WebglShaderSrc {
  id = "weblgl_pt_field";
  extra_uniforms = ["data"];
  vertex = `#version 300 es
  // Builtins:
  // in highp int gl_VertexID;
  // in highp int gl_InstanceID;
  // out highp vec4 gl_Position;
  // out highp float gl_PointSize;

  uniform mat4 projection;
  uniform mat4 view;
  uniform mat4 model;
  uniform ivec4 data;

  in vec4 origin_seed;

  ${rand_u16_of_u24}

  #line 2000
  void main() {
    // Decode size of grid (nx/ny/nz)
    //
    // Float values will be [0, 1] in steps of 1/(nx-1)
    uint nx = (uint(data.x) & 0xffffu) + 1u;
    uint ny = ((uint(data.x)>>16)& 0xffffu) + 1u;
    uint nz = (uint(data.y) & 0x3ffu) + 1u;
    uint u_instance_ofs = uint(data.w) & 0xffffu;

    highp float f_r_nx = (nx <= 2u) ? 1.0 : (0.999999 / float(nx - 1u));
    highp float f_r_ny = (ny <= 2u) ? 1.0 : (0.999999 / float(ny - 1u));
    highp float f_r_nz = (nz <= 2u) ? 1.0 : (0.999999 / float(nz - 1u));
    f_r_nx = (nx<=1u) ? 0.5: f_r_nx;
    f_r_ny = (ny<=1u) ? 0.5: f_r_ny;
    f_r_nz = (nz<=1u) ? 0.5: f_r_nz;

    // Decode kind of mapping
    bool is_sphere = (uint(data.z) & 0x1u) != 0u;
    bool project_cube = (uint(data.z) & 0x2u) != 0u;
    bool square_law = (uint(data.z) & 0x4u) != 0u;
    uint u_sz_min = ((uint(data.z)>>16) & 0x3u); // 0 to 3
    uint u_sz_range = ((uint(data.z)>>18) & 0x3u); // 0 to 3
    uint u_sz_random_weight = (uint(data.z)>>20) & 0xfu;
    uint u_pt_random_weight = (uint(data.z)>>24) & 0xffu;
    float f_sz_random_weight = float(u_sz_random_weight) / 15.0;
    float f_pt_random_weight = float(u_pt_random_weight) / 255.0;

    // Decode 32-bit pseudo-random seed
    uint u_seed = floatBitsToUint(origin_seed.w);
    uint u_seed_l = u_seed & 0xffffffu;        // 24 bits
    uint u_seed_m = ((u_seed >> 24) ^ (u_seed << 8))  & 0xffffffu;    // 24 bits
    uint u_seed_h = ((u_seed >> 8) ^ (u_seed << 12))  & 0xffffffu;    // 24 bits

    // Shuffle bottom 6 bits of the instance ID into other bits
    uint u_id_in = uint(gl_InstanceID) + u_instance_ofs;
    uint u_id = u_id_in >> 6;
    u_id += ((u_id_in & 1u)==0u) ? 0xfedcbaa0u : 0u;
    u_id += ((u_id_in & 2u)==0u) ? 0x123a8290u : 0u;
    u_id += ((u_id_in & 4u)==0u) ? 0x03048568u : 0u;
    u_id += ((u_id_in & 8u)==0u) ? 0x10010014u : 0u;
    u_id += ((u_id_in & 16u)==0u) ? 0x20503022u : 0u;
    u_id += ((u_id_in & 32u)==0u) ? 0x10239513u : 0u;

    // Generate 48 pseudo random bits based on (~30 bits max of) gl_InstanceID and incoming 32-bit seed
    uint u_id_l = u_id & 0xfffu; // 12 bits
    uint u_id_m = (u_id>>12) &0xfffu; // 12 bits
    uint u_id_h = (u_id>>20) &0xfffu; // 12 bits max

    uint u_r16_id_l = rand_u16_of_u24((u_id_l ^ (u_id_m << 3) ^ (u_id_h << 5) ^ u_seed_l));
    uint u_r16_id_m = rand_u16_of_u24((u_id_m ^ (u_id_h << 5) ^ (u_id_l << 8) ^ u_seed_m));
    uint u_r16_id_h = rand_u16_of_u24((u_id_h ^ (u_id_l << 7) ^ (u_id_m << 11) ^ u_seed_h));

    uint u_r32 = (u_r16_id_m << 16) | u_r16_id_l;
    uint u_r_x = u_r32 % nx; // 16 bits max
    uint u_r_y = (u_r32 / nx) % ny; // 16 bits max
    uint u_r_z = (u_r32 / (nx*ny)) % nz; // 10 bits max
    uint u_sz = u_r16_id_h & 0xffu;

    // Convert unsigned random to float random
    vec3 f_r = vec3(
      float(u_r_x) * f_r_nx,
      float(u_r_y) * f_r_ny,
      float(u_r_z) * f_r_nz
    );

    float f_sz = (float(u_sz) / 255.0) * (float(u_sz_range)) + float(u_sz_min+1u);

    vec3 f_id = vec3(
      float(uint(gl_InstanceID) % nx) * f_r_nx,
      float((uint(gl_InstanceID) / nx) % ny)* f_r_ny,
      float((uint(gl_InstanceID) / (nx*ny)) % nz) * f_r_nz
      );

    vec3 f = fract(mix(f_id, f_r, f_pt_random_weight)) - vec3(0.5,0.5,0.5);

    vec3 position = f;
    float scale = 1.0;
    if (is_sphere) {
      float f_theta = f.x * 6.283185307179586;
      float f_sin_theta = sin(f_theta);
      float f_cos_theta = cos(f_theta);
      // Was 2*sqrt(y-y^2) for y=0 .. 1; i.e. 0, sqrt(3)/2, 1, sqrt(3)/2, 0 for y = n / 4
      // For y=-0.5 to +0.5 plug in y = new_y + 0.5; y-y^2 = 0.25 - new_y^2
      float f_sin_phi = 2.0 * sqrt( 0.25 - f.y*f.y);
      float f_cos_phi = 2.0 * f.y;
      scale = (0.5 - f.z) / 2.0;
      position = vec3(f_sin_theta * f_sin_phi, f_cos_theta*f_sin_phi, f_cos_phi);
    }
    vec3 position_abs = abs(position);
    scale = project_cube ? (1.0 /  max(max(position_abs.x, position_abs.y), position_abs.z)) : scale;
    scale = square_law ? sqrt(scale) : scale;
    position = position * scale;
    gl_Position = projection * view * model * vec4(position + origin_seed.xyz, 1.0);
    gl_PointSize = f_sz;
  }
  `;
  fragment = `#version 300 es
  precision mediump float;
  uniform vec4 color;

  out vec4 FragColor; // must be the only output declaration; is not implicit!

  void main() {
  FragColor.r = color.r;
  FragColor.g = color.g;
  FragColor.b = color.b;
  FragColor.a = color.a;
  FragColor = vec4(1,1,1,1);
  }
  `;
}

export enum WebglPtFieldKind {
  Uniform = 0,
  SphereMap = 1,
  CubeSurface = 2,
  CubeSurfaceSphereMap = 3,
}

export class WebglPtFieldObj implements WebglObjKind {
  position_buf: WebGLBuffer | null = null;
  indices_buf: WebGLBuffer | null = null;
  num_points: number = 0;
  nx: number = 1024; // 16 bits
  ny: number = 1024; // 16 bits
  nz: number = 1; // 12 bits
  min_sz: number = 0; // 2 bits
  max_sz: number = 0; // 2 bits
  field_kind: WebglPtFieldKind = WebglPtFieldKind.Uniform;
  pt_random_weight: number = 0; // 8 bits
  sz_random_weight: number = 0; // 4 bits
  random_seed: number = 0x1234678;

  encoded: boolean = false;
  data: Int32Array;

  /** Construct with a regular grid; set num_points to equal nx*ny*nz */
  constructor(
    num_points: number,
    nx: number = 1024,
    ny: number = 1024,
    nz: number = 1,
  ) {
    this.data = new Int32Array(4);
    this.num_points = num_points;
    this.nx = Math.min(Math.max(Math.floor(nx), 1), 65536);
    this.ny = Math.min(Math.max(Math.floor(ny), 1), 65536);
    this.nz = Math.min(Math.max(Math.floor(nz), 1), 4096);
  }

  static sphere_surface(
    num_points: number,
    sparsity: number = 1,
    nx: number = 0,
    ny: number = 0,
  ): WebglPtFieldObj {
    if (nx < 1) {
      nx = Math.max(1, Math.ceil(Math.sqrt(num_points * sparsity)));
      ny = Math.ceil((num_points * sparsity) / nx);
    }
    const sphere = new WebglPtFieldObj(num_points, nx, ny, 1);
    sphere.field_kind = WebglPtFieldKind.SphereMap;
    return sphere;
  }

  set_num_points(num_points: number): WebglPtFieldObj {
    this.num_points = num_points;
    this.encoded = false;
    return this;
  }

  set_dims(nx: number, ny: number = 0, nz: number = 0): WebglPtFieldObj {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    this.encoded = false;
    return this;
  }

  set_field_kind(field_kind: WebglPtFieldKind): WebglPtFieldObj {
    this.field_kind = field_kind;
    this.encoded = false;
    return this;
  }

  set_pt_random_weight(pt_random_weight: number): WebglPtFieldObj {
    this.pt_random_weight = pt_random_weight;
    this.encoded = false;
    return this;
  }

  set_size_range(min_sz: number, max_sz: number): WebglPtFieldObj {
    this.min_sz = min_sz;
    this.max_sz = max_sz;
    this.encoded = false;
    return this;
  }

  set_sz_weight(sz_random_weight: number): WebglPtFieldObj {
    this.sz_random_weight = sz_random_weight;
    this.encoded = false;
    return this;
  }

  do_encode() {
    this.data[0] = (this.nx - 1) | ((this.ny - 1) << 16);
    this.data[1] = this.nz - 1;
    this.data[2] =
      this.field_kind |
      (Math.min(Math.max(Math.floor(this.min_sz - 1), 0), 3) << 16) |
      (Math.min(Math.max(Math.floor(this.max_sz - this.min_sz), 0), 3) << 18) |
      (Math.min(Math.max(Math.floor(this.sz_random_weight * 15), 0), 15) <<
        20) |
      (Math.min(Math.max(Math.floor(this.pt_random_weight * 255), 0), 255) <<
        24);
    this.data[3] = 0;
    console.log(this);
    this.encoded = true;
  }

  webgl_create(webgl: WebGL2RenderingContext) {
    this.position_buf = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.position_buf);
    webgl.bufferData(
      webgl.ARRAY_BUFFER,
      new Float32Array([0, 0, 0, this.random_seed]),
      webgl.STATIC_DRAW,
    );

    this.indices_buf = webgl.createBuffer();
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, this.indices_buf);
    webgl.bufferData(
      webgl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([0]),
      webgl.STATIC_DRAW,
    );
  }

  webgl_set_uniforms(webgl: Webgl) {
    if (!this.encoded) {
      this.do_encode();
    }
    webgl.set_uniform_ivec4(WebglUniform.Extra0, this.data);
  }

  webgl_draw(webgl: WebGL2RenderingContext) {
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.position_buf);
    webgl.enableVertexAttribArray(0);
    webgl.vertexAttribPointer(0, 4, webgl.FLOAT, false, 0, 0);

    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, this.indices_buf);

    webgl.drawElementsInstanced(
      webgl.POINTS,
      1,
      webgl.UNSIGNED_SHORT,
      0,
      this.num_points,
    );
  }
}
