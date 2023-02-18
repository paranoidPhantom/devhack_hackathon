const http = require("http")
const https = require('https');
const fs = require("fs")
const tgAPI = require('node-telegram-bot-api');
const VTapi = require('api')('@virustotal/v3.0#ejc31lduc892u');
const { Base64 } = require('js-base64');
const superagent = require('superagent');
const path = require("path")
const port = 3000
var secrets = JSON.parse(fs.readFileSync(__dirname + '/secrets.json'))
var gCONFIG = JSON.parse(fs.readFileSync(__dirname + '/config.json'))
var colors = require('colors');

const bot = new tgAPI(secrets.telegramBotToken, { polling: true });

function sendRes(url, contentType, response) {
    const file = path.join(__dirname + "/", url)
    fs.readFile(file, (error, content) => {
        if (error) {
            response.writeHead(404)
            response.write("File not found | 404")
            response.end()
            console.log("Could not find file: " + file)
        } else {
            try {
                if (JSON.parse(content).isSecret == true) {
                    response.writeHead(403)
                    response.write("You do not have permission to view this | 403")
                    response.end()
                    console.log("Returned 403: file is secret")
                    response = null
                    content = null
                    return
                }
            } catch (error) { }
            response.writeHead(200, { 'Content-Type': contentType })
            response.write(content)
            response.end()
            console.log("Got file: " + file)
        }
    })
}

function getContentType(url) {
    switch (path.extname(url)) {
        case ".html": return "text/html"
        case ".css": return "text/css"
        case ".js": return "text/javascript"
        case ".json": return "application/json"
        case ".svg": return "image/svg"
        case ".png": return "image/png"
        default: return "application/octate-stream"
    }
}

const respondToAPI = (request, response) => {
    const args = request.split("/")
    const request_type = args[2]
    const convertedID = Base64.encode(request.replace("/api/checkWebsite/", ""), true)
    console.log(convertedID)
    switch (request_type) {
        case "checkWebsite": {
            var pageData = "Oops!"
            superagent.get('https://virustotal.com/api/v3/urls/'+convertedID)
                .query({
                    "X-Apikey": "4f568290f7207277244dce36f5b2e11c9cab01c57848795421ae0fa988a93967",
                })
                .end((err, res) => {
                    if (err) { return console.log(err); }
                    response.writeHead(200, { 'Content-Type': "text/html" })
                    response.write(res.data)
                    response.end()
                });
        }
    }
}

const server = http.createServer(function (request, response) {
    if (request.url === "/") {
        sendRes("index.html", "text/html", response)
    } else if (request.url.startsWith("/api")) {
        respondToAPI(request.url, response)
    } else {
        sendRes(request.url, getContentType(request.url), response)
    }
})

server.listen(port, function (error) {
    if (error) {
        console.log("Something went wrong!", error)
    } else {
        console.log(("Server is listening on port " + port).rainbow)
    }
})


// BOT starts here:

bot.setMyCommands([
    {
        command: "/start",
        description: "Стартовая команда"
    }
])

bot.onText("/start", (msg, match) => {
    const chatID = msg.chat.id
    const actionOptions = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{
                    text: "Проверить ссылку",
                    callback_data: "check_link"
                }]
            ]
        })
    }
    bot.sendMessage(chatID, "Привет, что бы ты хотел сделать?")
})

bot.on("callback_query", msg => {
    console.log(msg.data)
})