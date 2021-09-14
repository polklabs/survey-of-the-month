const path = require('path');

module.exports = {
    entry: './server.ts',
    mode: 'production',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, '.'),
        filename: 'server.bundle.js'
    }
};