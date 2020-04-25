// 开发环境webpack
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const glob = require('glob')
const PATH = require('./path')


function getEntries (globPath) {
    const files = glob.sync(globPath);
    const entries = {};
    files.forEach((filepath)=> {
        console.log('filepath',filepath)
        const split = filepath.split('/');
        console.log('split',split)
        const name = split[split.length-1].replace('.js','');
        entries[name] = './' + filepath;
    })
    console.log(entries)
    return entries
}
const entries = getEntries('src/js/*.js')

module.exports = {
    entry: entries,
    output: {
        filename:'[name].bundle.js',
        path: PATH.BUILD_PATH,
    },
    mode: 'development',
    devServer: {
        contentBase: './build',
        host:'0.0.0.0',
        disableHostCheck:true,
       hot: true
    },
    module: {
        rules: [
            {test:require.resolve('jquery'),loader: "expose?jQuery"},
            {test:require.resolve('jquery'),loader: "expose?$"},
            {
                test:/\.js$/,
                exclude: /(node_modules)/,
                loader:["babel-loader"],
            },
            {
                test: /\.css$/,
                include: /src/,
                use: [{
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                      // you can specify a publicPath here
                      // by default it uses publicPath in webpackOptions.output
                      publicPath: '../src/css',
                      hmr: process.env.NODE_ENV === 'development',
                    },
                  },'css-loader','style-loader']
            },{
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                'file-loader'
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.js','.jsx']
    },
    plugins: [
        // new ExtractTextPlugin(
        //     {
        //         "$":"jquery",
        //         "jQuery":"jquery",
        //         "window.jQuery":"jquery"
        //     }
        // ),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // all options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
            ignoreOrder: false, // Enable to remove warnings about conflicting order
          }),
        new CleanWebpackPlugin(),
        new HTMLWebpackPlugin({
            template:path.resolve(__dirname,'../src/view/popup.html')
        }),
        new webpack.HotModuleReplacementPlugin()
    ],
    

}