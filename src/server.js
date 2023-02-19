const http = require("http")
const fs = require("fs")
const tgAPI = require('node-telegram-bot-api');
const VTapi = require('api')('@virustotal/v3.0#ejc31lduc892u');
const path = require("path")
const port = 3000
var secrets = JSON.parse(fs.readFileSync(__dirname + '/secrets.json'))
var gCONFIG = JSON.parse(fs.readFileSync(__dirname + '/config.json'))
var colors = require('colors');

const WhoisApi = require('whois-api-js');
const { create } = require("domain");

const WhoisApiClient = new WhoisApi.Client(secrets.WhoisApi)
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
    switch (request_type) {
        case "checkWebsite": {
            const url = request.replace("/api/checkWebsite/", "")
            let WhoisData = null
            WhoisApiClient.getRaw(url, WhoisApi.JSON_FORMAT)
                .then(function (data) {
                    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
                    var suspoints = 0
                    const urlObject = new URL(url)
                    var DataToReturn = {}
                    const addField = (field, value) => {
                        DataToReturn[field] = value
                    }
                    WhoisData = JSON.parse(data).WhoisRecord
                    // Registrant info
                    const registrant = WhoisData["registrant"]
                    try {
                        const registrantFlagURL = "https://countryflagsapi.com/png/" + registrant.countryCode
                        addField("reg_flag", registrantFlagURL)
                    } catch (error) { }
                    try {
                        const registrantCountry = registrant.country
                        addField("Страна регистрации", registrantCountry)
                    } catch (error) { }
                    try {
                        const registrantOrg = registrant.organization
                        addField("Организация регистрации", registrantOrg)
                    } catch (error) { }
                    // Date created
                    try {
                        const createdDate = new Date(WhoisData.createdDate)
                        addField("Дата регистрации", createdDate)
                        suspoints += (createdDate.getFullYear() - 2015) / 10
                    } catch (error) { }
                    // Email
                    try {
                        const contactEmail = WhoisData["contactEmail"]
                        addField("Контактный адрес электронной почты", contactEmail)
                    } catch (error) { }
                    // Hosts
                    try {
                        const hosts = WhoisData.nameServers.hostNames
                        addField("hosts", createdDate)
                        suspoints = suspoints / hosts.length
                    } catch (error) { }
                    try {
                        let count = 0
                        const subdomains = urlObject.host.split(".")
                        for (let i = 2; i < 100; i++) {
                            if (subdomains[i]) {
                                count += 1
                                suspoints += 1
                            }
                        }
                        addField("Субдоменов", count)
                    } catch (error) { console.log(error) }
                    suspoints = clamp(suspoints, 0, 10)
                    addField("Подозрительность", suspoints)
                    response.writeHead(200, { 'Content-Type': "application/json" })
                    response.write(JSON.stringify(DataToReturn))
                    response.end()
                })
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

bot.onText(/\/start/, (msg, match) => {
    const chatId = msg.chat.id
    const actionOptions = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{
                    text: "Проверить ссылку",
                    callback_data: "action_check_link"
                }],
                [{
                    text: "Проверить QR код",
                    callback_data: "action_check_qr"
                }]
            ]
        })
    }
    bot.sendMessage(chatId, 'Привет! Что бы ты хотел сделать?',actionOptions)
})


bot.on('callback_query', (msg) => {
    const data = msg.data
    const chatId = msg.message.chat.id
    if (data.startsWith("action_")){
        const action = data.replace("action_","")
        switch (action) {
            case "check_link":{
                bot.sendMessage(chatId,"↓ Хорошо, введи ссылку которую хочешь проверить ↓")
                break
            };
            case "check_qr":{
                bot.sendMessage(chatId,"Намного удобнее сканировать QR коды на нашем <a href='/'>сайте</a>",{parse_mode: 'HTML'})
                break
            };
        }
    }
})