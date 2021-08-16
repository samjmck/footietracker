const { entries, htmlWebpackPlugins, dotenvPlugin, copyWebpackPlugin } = require('./webpack.common');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: entries,
    devtool: 'source-map',
    output: {
        filename: '[name].[hash].bundle.js',
        chunkFilename: '[name].[chunkhash].chunk.js',
        path: `${__dirname}/dist`,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.svg'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, '../shared'),
                ],
                use: ['babel-loader'],
            },
            {
                test: /\.(ts|tsx)$/,
                include: [
                    path.resolve(__dirname, 'scripts'),
                    path.resolve(__dirname, '../shared'),
                ],
                use: ['awesome-typescript-loader'],
            },
            {
                test: /\.(png|svg|jpg|gif|webp)$/,
                use: ['file-loader'],
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin(`${__dirname}/dist`),
        copyWebpackPlugin,
        ...htmlWebpackPlugins,
        new MiniCssExtractPlugin({
            filename: '[name].[hash].css',
            chunkFilename: '[id].[hash].css'
        }),
        dotenvPlugin,
    ],
};
