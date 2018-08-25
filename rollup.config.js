import loadz0r from 'rollup-plugin-loadz0r';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
	input: 'src/main.js',
	output: {
		dir: 'public/scripts',
		format: 'amd',
		sourcemap: true
	},
	plugins: [
		loadz0r(),
		resolve(),
		commonjs()
	],
	experimentalCodeSplitting: true
};