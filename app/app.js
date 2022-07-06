const express = require('express');
const path = require('path');
const yaml_config = require('node-yaml-config');

const authBackend = require('./api/authBackend');
const getDashboardData = require("./api/dataBackend");

const PORT = process.env.PORT || 8080;
const CONFIG = yaml_config.load(__dirname + '/config.yml');

const app = express();
app.use('/css', express.static('static/css'));
app.use('/js', express.static('static/js'));
app.use('/img', express.static('static/img'));

app.get('/', async function (req, res) {
    res.sendFile(path.join(__dirname, 'static', '/dashboard.html'));
});

app.get('/api', (req, res) => {
    try {
        const type = req.query.q
        const query = CONFIG.queries[type]
        res.header("Access-Control-Allow-Origin", "*");
        if (!query) {
            return res.status(404).send("Invalid query type");
        }
        authBackend().then((tokenResponse) => {
            let data = getDashboardData(query, tokenResponse)
            data.then(result => {
                res.send(result)
            }).catch((error) => {
                console.error(error);
                return res.status(503).send("CubeJS call failed, please check query in config.yml");
            });
        }).catch((error) => {
            console.error(error);
            return res.status(503).send("Fetching token failed");
        });
    } catch (error) {
        console.error(error);
        return res.status(503).send("General error, please check logs")
    }
});

app.listen(PORT);
console.log(`Server running at http://localhost:${PORT}`);
