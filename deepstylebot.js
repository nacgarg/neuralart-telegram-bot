require('dotenv').load();

var telegram = require('telegram-bot-api');
var exec = require('child_process').exec
var request = require('request');
var fs = require('fs');

var tkn = process.env.TKN;
var api = new telegram({
	token: tkn,
	updates: {
		enabled: true
    }
});

var style = "style.jpg"
var content = "content.jpg"
var running = false;

api.on('message', function(msg){
	console.log(msg);
	if (msg.photo && msg.caption){
		if (msg.caption === "style") {
			getImage(msg.photo[msg.photo.length-1].file_id, style, function(){ api.sendMessage({chat_id:msg.chat.id, text: "Yay! Set the style."})})
		} 
		if (msg.caption === "content") {
			getImage(msg.photo[msg.photo.length-1].file_id, content, function(){ api.sendMessage({chat_id:msg.chat.id, text: "Yay! Set the content. yw maya"})})
		}
	}
	if (msg.text){
		if (msg.text === "/art") {
			makeImage(style, content, function(err){
				if (err) {
					api.sendMessage({chat_id: msg.chat.id, text: JSON.stringify(err)})
				} else {
					api.sendPhoto({
						chat_id:msg.chat.id,
						caption: "Here ya go bb",
						photo: "output.jpg"
					})
				}
			})
		}
	}
});

var makeImage = function(style, content, callback) {
	if (!running) {
		running = true;
		exec('qlua main.lua --display_interval 0 --model inception --style ' + style + ' --content ' + content, function(err, s, b){
			running = false;
			callback(err);
		});
	} else {
		callback({"FRICKING AND REGULAR ERROR": "STOP SPAMMING U SKRUB"})
	}
}

var getImage = function(id, path, cb) {
	request.get('https://api.telegram.org/bot'+tkn+'/getFile?file_id='+id, function(err, resp, body){
		var filePath = JSON.parse(body).result.file_path;
		var file = fs.createWriteStream(path)
		var r = request('https://api.telegram.org/file/bot'+tkn+'/'+filePath).pipe(file);
		r.on('finish', function() {file.close(cb)});
	});
}
