export default {
    input: 'src/index.js',
    output: [
        { file: 'dist/as.umd.js', format: 'umd', name: 'as', sourcemap: true },
        { file: 'dist/as.js', format: 'esm', sourcemap: true },
    ],
}