const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    'background/service-worker': './src/background/service-worker.ts',
    'content/content': './src/content/content.ts',
    'popup/popup': './src/popup/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public', to: 'public' }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup/popup']
    }),
    new MiniCssExtractPlugin({
      filename: 'src/content/styles.css'
    })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  mode: 'development'
};