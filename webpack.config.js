const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        fallback: {
            assert: require.resolve('assert'),
            crypto: require.resolve('crypto-browserify'),
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            os: require.resolve('os-browserify'),
            stream: require.resolve('stream-browserify'),
            zlib: require.resolve('browserify-zlib'),
            'process/browser': require.resolve('process/browser.js'),
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    devtool: false,
    plugins: [
        new webpack.ProvidePlugin({
            'process/browser': 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
};
