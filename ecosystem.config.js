module.exports = {
    apps: [{
        name: "sloshdb",
        script: "./dist/",
        env: {
            NODE_ENV: "production"
        },
    }]
};