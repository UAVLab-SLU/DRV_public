const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const cesiumTokenFiles = [
    process.env.CESIUM_TOKEN_FILE,
    path.resolve(__dirname, "../credentials/frontend-cesium-token.json"),
    "/credentials/frontend-cesium-token.json",
].filter(Boolean);

function readCesiumToken() {
    for (const tokenFile of cesiumTokenFiles) {
        try {
            if (!fs.existsSync(tokenFile)) {
                continue;
            }

            const tokenConfig = JSON.parse(fs.readFileSync(tokenFile, "utf8"));
            const token = typeof tokenConfig.token === "string" ? tokenConfig.token.trim() : "";

            if (!token) {
                throw new Error("missing token field");
            }

            return token;
        } catch (error) {
            console.warn(`Unable to read Cesium token from ${tokenFile}: ${error.message}`);
        }
    }

    return process.env.REACT_APP_CESIUM_ION_ACCESS_TOKEN || "";
}

const cesiumIonAccessToken = readCesiumToken();
process.env.REACT_APP_CESIUM_ION_ACCESS_TOKEN = cesiumIonAccessToken;

module.exports = {
    plugins: [
        {
            plugin: require("craco-cesium")()
        }
    ],
    webpack: {
        configure: (webpackConfig) => {
            // Enable polling for file changes in Docker
            webpackConfig.watchOptions = {
                poll: 1000, // Check for changes every second
                aggregateTimeout: 300, // Delay before rebuilding
                ignored: /node_modules/,
            };

            webpackConfig.plugins.push(
                new webpack.DefinePlugin({
                    "process.env.REACT_APP_CESIUM_ION_ACCESS_TOKEN": JSON.stringify(cesiumIonAccessToken),
                })
            );

            return webpackConfig;
        },
    },
};
