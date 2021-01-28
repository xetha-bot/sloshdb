module.exports = {
    apps: [{
        name: "sloshdb",
        script: "./dist/src/",
        env: {
            NODE_ENV: "production"
        },
    }]
};