module.exports = {
    mode: "development",
    entry: "./src/App.tsx",
    target: "electron-renderer",
    output: {
        filename: "App.js"
    },
    module: {
        rules: [
            { 
                test: /\.tsx?/, 
                use: "babel-loader"
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    }
}