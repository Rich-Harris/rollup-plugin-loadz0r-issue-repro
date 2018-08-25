# rollup-plugin-loadz0r issue repro

This repo exists to demonstrate an issue with [rollup-plugin-loadz0r](https://github.com/surma/rollup-plugin-loadz0r): because script `src` attributes are resolve relative to the current page, rather than the script doing the importing, it doesn't work if your scripts live in a sub-directory or if you're on a non-root page.

Webpack solves this with [`options.publicPath`](https://webpack.js.org/configuration/output/#output-publicpath). Since Rollup is (normally) loaderless, it probably doesn't make sense to implement the same option in Rollup itself, but it might make sense to implement it in loadz0r.

Original README follows:

---

# rollup-starter-app

This repo contains a bare-bones example of how to create an application using Rollup, including importing a module from `node_modules` and converting it from CommonJS.

*See also https://github.com/rollup/rollup-starter-lib*


## Getting started

Clone this repository and install its dependencies:

```bash
git clone https://github.com/rollup/rollup-starter-app
cd rollup-starter-app
npm install
```

The `public/index.html` file contains a `<script src='bundle.js'>` tag, which means we need to create `public/bundle.js`. The `rollup.config.js` file tells Rollup how to create this bundle, starting with `src/main.js` and including all its dependencies, including [date-fns](https://date-fns.org).

`npm run build` builds the application to `public/bundle.js`, along with a sourcemap file for debugging.

`npm start` launches a server, using [serve](https://github.com/zeit/serve). Navigate to [localhost:3000](http://localhost:3000).

`npm run watch` will continually rebuild the application as your source files change.

`npm run dev` will run `npm start` and `npm run watch` in parallel.

## License

[MIT](LICENSE).
