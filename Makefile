WASM_PACK = wasm-pack build --dev --target web
WASM_PACK = WASM_PACK_WASM_OPT=false wasm-pack build --release --target web
WASM_PACK = WASM_PACK_WASM_OPT=true wasm-pack build --dev --target web
WASM_PACK = wasm-pack build --dev --target web
WASM_PACK = WASM_PACK_WASM_OPT=true wasm-pack build --release --target web

JS_LIB = ../js_lib
TS = ./typescript/

.PHONY: all
all:
	${WASM_PACK} --out-dir ./http/wasm
	$(MAKE) js

start_http:
	(cd .. && python3 -m http.server 3001)

help:
	@echo "To compile the typescript to the 'js' directory (where it is checked into git):"
	@echo "    make js"
	@echo
	@echo "To install 'tsc' first install node (sad face): node-v24.14.1.pkg"
	@echo "Then"
	@echo "    make install_tsc"
	@echo ""
	@echo
	@echo "To run the image-handling server use"
	@echo "    make start_server"
	@echo
	@echo "    make upgrade_from_js_lib"

.PHONY: install_tsc
install_tsc:
	npm install typescript

.PHONY: upgrade_from_js_lib
upgrade_from_js_lib:
	cp ${JS_LIB}/typescript/animate.ts ${TS}
	cp ${JS_LIB}/typescript/color.ts ${TS}
	cp ${JS_LIB}/typescript/draw.ts ${TS}
	cp ${JS_LIB}/typescript/html.ts ${TS}
	cp ${JS_LIB}/typescript/log.ts ${TS}
	cp ${JS_LIB}/typescript/tabs.ts ${TS}

js:
	npx tsc -b

.PHONY: zip
zip: album.zip

album.zip: http http/javascript http/wasm
	rm -f album.zip

	zip album.zip favicon.ico
	zip album.zip http/index.html
	zip album.zip http/*css
	zip album.zip http/javascript
	zip album.zip http/javascript/*js
	zip album.zip http/wasm
	zip album.zip http/wasm/*
