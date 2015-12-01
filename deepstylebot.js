require('dotenv').load();

var TelegramBot = require('node-telegram-bot-api');
var exec = require('child_process').exec
var request = require('request');
var fs = require('fs');

var tkn = process.env.TKN;
var bot = new TelegramBot(tkn, {
    polling: {
        interval: 1,
        timeout: 4
    }
});

var style = "style.jpg"
var content = "content.jpg"
var running = false;
var styleRegex = /^style$/i;
var contentRegex = /^content$/i;

bot.onText(/^\/art(?:@neuralart_bot)?$/i, function (msg, match) {
    var fromId = msg.from.id;
	console.log("recieved");
	bot.sendMessage(fromId, 'Working..', {
		reply_to_message_id: msg.message_id
	});
	makeImage(style, content, function (err) {
		if (err) {
			bot.sendMessage(fromId, JSON.stringify(err), {
				reply_to_message_id: msg.message_id
			});
		} else {
			bot.sendPhoto(fromId, 'output.jpg', {
				caption: 'Output',
				reply_to_message_id: msg.message_id
			});
		}
	})

});

bot.onText(/^\/style(?:@neuralart_bot)?$/i, function (msg, match) {
    var fromId = msg.from.id;
	console.log("recieved");
	bot.sendPhoto(fromId, __dirname + '/' + style, {
		caption: 'Style'
	});
});

bot.onText(/^\/content(?:@neuralart_bot)?$/i, function (msg, match) {
    var fromId = msg.from.id;
	console.log("recieved");
    bot.sendPhoto(fromId, __dirname + '/' + content, {
		caption: 'Content'
    });
});

bot.on('message', function (msg) {
    console.log(msg);
    if (msg.photo && msg.caption) {
		var fromId = msg.from.id;
        if (styleRegex.exec(msg.caption)) {
            getImage(msg.photo[msg.photo.length - 1].file_id, style, function () {
				bot.sendMessage(fromId, "Yay! Set the style.");
            })
        } else if (contentRegex.exec(msg.caption)) {
            getImage(msg.photo[msg.photo.length - 1].file_id, content, function () {
				bot.sendMessage(fromId, "Yay! Set the content.");
            })
        }
    }
});

var makeImage = function (style, content, callback) {
    if (!running) {
        running = true;
        exec('qlua main.lua --display_interval 0 --model inception --style ' + style + ' --content ' + content, function (err, s, b) {
            running = false;
            callback(err);
        });
    } else {
        callback({
            "error": "currently running, please wait"
        })
    }
}

var getImage = function (id, path, cb) {
    request.get('https://api.telegram.org/bot' + tkn + '/getFile?file_id=' + id, function (err, resp, body) {
        try {
            var parsed = JSON.parse(body);
        } catch (e) {
            console.log('Error downloading file, trying again.')
            getImage.apply(Array.from(arguments));
        }
        var filePath = JSON.parse(body).result.file_path;
        var file = fs.createWriteStream(path)
        var r = request('https://api.telegram.org/file/bot' + tkn + '/' + filePath).pipe(file);
        r.on('finish', function () {
            file.close(cb)
        });
    });
}
