// 开发环境webpack
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-wepack-plugin')
const CleanPlugin = require('clean-webpack-plugin')
const path = require('path')
const fs = require('fs')
const PATH = require('./path')
const entryFiles = fs.readFileSync(PATH.ENTRY_PATH);

const files = [];
const entries = {};

// 获取多入口文件
entries
    .filter(file => file.split('.')[0] && file.split('.').slice(-1)[0] === 'js' )
    .forEach(file => {
        const filename = file.split('.')[0];
        const filepath = path.join(PATH.ENTRY_PATH,file)
        entries[filename] = filepath;
    });

module.exports = {
    entry: entries,
    output: {
        filename:'[name].bundle.js',
        path: PATH.BUILD_PATH,
    },
    devServer: {
        contentBase: './dist',
       hot: true
    },
    module: {
        rules: [
            {test:require.resolve(jquery),loader: "expose?jQuery"},
            {test:require.resolve(jquery),loader: "expose?$"},
            {
                test:/\.js$/,
                exclude: /(node_modules)/,
                loader:["babel-loader"],
                use: {
                    presets:["ex2015"]
                }
            },
            {
                test: /\.css$/,
                include: /src/,
                use: ['css-loader','style-loader']
            },{
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                'file-loader'
                ]
            }


        ]
    },
    resolve: {
        extensions: ['','.js','.jsx']
    },
    plugins: [
        new ExtractTextPlugin({
            $:"jquery",
            jQuery:"jquery",
            "window.jQuery":"jquery"
        }),
        new CleanPlugin(PATH.BUILD_PATH,{
            root:PATH.ROOT_PATH,
            verbose: true
        })
    ],
    

}