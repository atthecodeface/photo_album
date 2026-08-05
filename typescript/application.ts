export class Application {
  // An init fn returns a Promise<T>; when that completes the T is pushed onto the init_io
  application_wasm_init_fns: (() => Promise<any>)[];
  application_wasm_init_io: any[];
  application_location: Location;

  constructor(wasm_init_fns: (() => Promise<any>)[]) {
    this.application_wasm_init_fns = wasm_init_fns;
    this.application_wasm_init_io = [];
    this.application_location = window.location;
    window.addEventListener("load", this.application_wasm_init_next.bind(this));
  }

  application_wasm_init_next(_e?: any) {
    const wasm_init_fn = this.application_wasm_init_fns.pop();
    if (wasm_init_fn === undefined) {
      this.application_init();
    } else {
      wasm_init_fn().then(this.application_wasm_initialized.bind(this));
    }
  }

  application_wasm_initialized(init_result: any) {
    this.application_wasm_init_io.push(init_result);
    this.application_wasm_init_next();
  }

  application_init() {
    console.log("application_init successful - this should have an override for the actual appliaction");
  }
}
