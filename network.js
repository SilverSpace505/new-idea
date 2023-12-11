var ws = null

var connected = false

var queue = []

var data = {x: 0, y: 0}

var playerData = {}

function sendMsg(sendData, bypass=false) {
	if (ws.readyState == WebSocket.OPEN && (connected || bypass)) {
		ws.send(JSON.stringify(sendData))
	}
    if (ws.readyState != WebSocket.OPEN) {
        queue.push(sendData)
    }
}

function connectToServer() {
    console.log("Connecting...")
    if (ws) {
        if (ws.readyState != WebSocket.CLOSED) {
			ws.close()
		}
    }
    connected = false
	ws = new WebSocket("wss://new-idea.glitch.me")

    ws.addEventListener("open", (event) => {
        sendMsg({connect: true}, true)
    })

    ws.addEventListener("message", (event) => {
        var msg = JSON.parse(event.data)
        if ("data" in msg) {
            playerData = msg.data
        }
        if ("id" in msg) {
            connected = true
            console.log("Connected with id: " + msg.id)
        }
        if ("chunk" in msg) {
            let chunk = msg.chunk[0]
            let sp = chunk.split(","); sp[0] = parseInt(sp[0]); sp[1] = parseInt(sp[1])
            loadingChunks.splice(loadingChunks.indexOf(chunk), 1)
            genChunk(parseInt(chunk.split(",")[0]), parseInt(chunk.split(",")[1]))
            if (msg.chunk[1] && chunk in chunks) {
                let data = msg.chunk[1]
                for (let obj of data.objs) {
                    chunks[chunk].objs.push(obj)
                }
                for (let toDelete of data.delete) {
                    for (let i = 0; i < chunks[chunk].objs.length; i++) {
                        if (chunks[chunk].objs[i].i == toDelete) {
                            chunks[chunk].objs.splice(i, 1)
                            i--
                        }
                    }
                }
                for (let set of data.sets) {
                    setVal(set[0]+sp[0]*res, set[1]+sp[1]*res, set[2])
                }
            }
        }
        if ("delete" in msg) {
            let chunk = msg.delete[0]
            if (chunk in chunks) {
                for (let i = 0; i < chunks[chunk].objs.length; i++) {
                    if (chunks[chunk].objs[i].i == msg.delete[1]) {
                        chunks[chunk].objs.splice(i, 1)
                        i--
                    }
                }
            }
        }
        if ("create" in msg) {
            let chunk = msg.create[0]
            if (chunk in chunks) {
                chunks[chunk].objs.push(msg.create[1])
            }
        }
        if ("set" in msg) {
            let sp = msg.set[0].split(","); sp[0] = parseInt(sp[0]); sp[1] = parseInt(sp[1])
            setting.push([msg.set[1]+sp[0]*res, msg.set[2]+sp[1]*res, msg.set[3], 0])
        }
    })

    ws.addEventListener("close", (event) => {
		console.log("Disconnected from server")
        chunks = {}
        connected = false
	})
}

connectToServer()

setInterval(() => {
    if (ws.readyState == WebSocket.OPEN && connected) {
        while (queue.length > 0) {
            sendMsg(queue[0])
            queue.splice(0, 1)
        }
    }
}, 1000)

setInterval(() =>  {
    if (!connected || (ws.readyState != WebSocket.OPEN && ws.readyState != WebSocket.CONNECTING)) {
        connectToServer()
    }
}, 3000)

let setq = []

setInterval(() => {
    if (connected) {
        sendMsg({data: data})
    }
}, 1000/10)