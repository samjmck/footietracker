const { entries, htmlWebpackPlugins, dotenvPlugin, copyWebpackPlugin } = require('./webpack.common');

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: entries,
    output: {
        filename: '[name].[hash].bundle.js',
        chunkFilename: '[name].[chunkhash].chunk.js',
        path: `${__dirname}/dist`,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.svg'],
    },
    devtool: 'inline-source-map',
    devServer: {
        port: 8082,
        hot: true,
        contentBase: './dist',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                include: [
                    path.resolve(__dirname, 'scripts'),
                    path.resolve(__dirname, '../shared'),
                ],
                options: JSON.parse(fs.readFileSync(`${__dirname}/.babelrc`)),
                loader: 'babel-loader',
            },
            {
                test: /\.(png|svg|jpg|gif|webp)$/,
                use: ['file-loader'],
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(`${__dirname}/dist`),
        copyWebpackPlugin,
        ...htmlWebpackPlugins,
        dotenvPlugin,
        new webpack.HotModuleReplacementPlugin(),
    ],
};
