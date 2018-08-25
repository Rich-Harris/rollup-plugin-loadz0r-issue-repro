/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
  // If the loader is already loaded, just stop.
  if (self.define) {
    return;
  }
  const registry = {
    require: Promise.resolve(require)
  };

  async function singleRequire(name, resolve) {
    if (!registry[name]) {
      await new Promise(async resolve => {
        if ("document" in self) {
          const script = document.createElement("script");
          script.src = name;
          // Ya never know
          script.defer = true;
          document.head.appendChild(script);
          script.onload = resolve;
        } else {
          importScripts(name);
          resolve();
        }
      });

      if (!registry[name]) {
        throw new Error(`Module ${name} didn’t register its module`);
      }
    }
    resolve(registry[name]);
  }

  async function require(names, resolve) {
    const modules = await Promise.all(
      names.map(name => new Promise(resolve => singleRequire(name, resolve)))
    );
    resolve(modules.length === 1 ? modules[0] : modules);
  }

  self.define = (moduleName, depsNames, factory) => {
    if (registry[moduleName]) {
      // Module is already loading or loaded.
      return;
    }
    registry[moduleName] = new Promise(async resolve => {
      let exports = {};
      const deps = await Promise.all(
        depsNames.map(depName => {
          if (depName === "exports") {
            return exports;
          }
          return new Promise(resolve => singleRequire(depName, resolve));
        })
      );
      exports.default = factory(...deps);
      resolve(exports);
    });
  };
})();
define("./main.js",['require'], function (require) { 'use strict';

	new Promise(function (resolve, reject) { require(["./update.js"], resolve, reject) }).then(({ update }) => {
		// even though Rollup is bundling all your files together, errors and
		// logs will still point to your original source modules
		console.log('if you have sourcemaps enabled in your devtools, click on main.js:5 -->');

		update();
	});

});
//# sourceMappingURL=main.js.map
