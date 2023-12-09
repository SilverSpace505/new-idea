var ws = {}

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
        if (ws.readyState == WebSocket.OPEN) {
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
            }
        }
        if ("delete" in msg) {
            let chunk = msg.delete[0]
            if (chunk in chunks) {
                for (let i = 0; i < chunks[chunk].length; i++) {
                    if (chunks[chunk][i].i == msg.delete[1]) {
                        chunks[chunk].splice(i, 1)
                        i--
                    }
                }
            }
        }
        if ("create" in msg) {
            let chunk = msg.create[0]
            if (chunk in chunks) {
                chunks[chunk].push(msg.create[1])
            }
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
}, 2000)

setInterval(() => {
    if (connected) {
        sendMsg({data: data})
    }
}, 1000/10)