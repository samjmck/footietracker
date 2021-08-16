const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const CopyPlugin = require('copy-webpack-plugin');

const entries = {};
function scanDirectory(directory, startingDirectory = null) {
    for(const script of fs.readdirSync(directory)) {
        if(script.slice(script.length -3, script.length) !== '.ts') { // is another directory
            scanDirectory(`${directory}/${script}`, directory);
        } else {
            let entryKey = '';
            if(startingDirectory) {
                entryKey = directory.slice(startingDirectory.length + 1) + '/';
            }
            entries[`${entryKey}${script.slice(0, -3)}`] = `${directory}/${script}`;
        }
    }
}
scanDirectory(`${__dirname}/scripts/pages`);

const htmlWebpackPlugins = Object.keys(entries).map(entryName => new HtmlWebpackPlugin({
    chunks: [entryName],
    template: `${__dirname}/pages/${entryName}.html`,
    filename: `${__dirname}/dist/${entryName}.html`,
}));

if(process.env.ENV === undefined) {
    process.env.ENV = 'prod';
}
const dotenvFile = `.env.${process.env.ENV}`;

const dotenvPlugin = new Dotenv({
    path: dotenvFile,
    allowEmptyValues: true,
});

const copyWebpackPlugin = new CopyPlugin({
    patterns: [
        {
            from: 'static', to: '',
        },
        {
            from: `static-${process.env.ENV}`, to: '',
        },
    ],
});

module.exports = {
    entries,
    htmlWebpackPlugins,
    dotenvPlugin,
    copyWebpackPlugin,
};
