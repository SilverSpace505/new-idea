
utils.setup()
utils.setStyles()
utils.setGlobals()

var su = 0
var delta = 0
var lastTime = 0

ui.textShadow.bottom = "auto"

var camera = {x: 0, y: 0, zoom: 1}

var player = {x: 0, y: 0}

var players = {}

var chunks = {}
var loadingChunks = []

var tzoom = 1

function tick(timestamp) {
    requestAnimationFrame(tick)

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()
    input.setGlobals()

    if (keys["KeyW"]) {
        player.y -= 250*delta
    }
    if (keys["KeyS"]) {
        player.y += 250*delta
    }
    if (keys["KeyA"]) {
        player.x -= 250*delta
    }
    if (keys["KeyD"]) {
        player.x += 250*delta
    }
    if (keys["Minus"]) {
        tzoom *= 0.995
    }
    if (keys["Equal"]) {
        tzoom *= 1.005
    }

    if (mouse.lclick) {
        let wmouse = {x: (mouse.x - canvas.width/2)/camera.zoom + camera.x, y: (mouse.y - canvas.height/2)/camera.zoom + camera.y}
        for (let chunk in chunks) {
            for (let i = 0; i < chunks[chunk].objs.length; i++) {
                if (Math.sqrt((chunks[chunk].objs[i].x-wmouse.x)**2 + (chunks[chunk].objs[i].y-wmouse.y)**2) < 10) {
                    sendMsg({delete: [chunk, chunks[chunk].objs[i].i]})
                    chunks[chunk].objs.splice(i, 1)
                    i--
                }
            }
        }
    }

    if (mouse.rclick) {
        let wmouse = {x: (mouse.x - canvas.width/2)/camera.zoom + camera.x, y: (mouse.y - canvas.height/2)/camera.zoom + camera.y}
        let wcmouse = {x: Math.floor(wmouse.x/500), y: Math.floor(wmouse.y/500)}
        let chunk = wcmouse.x+","+wcmouse.y
        if (chunk in chunks && chunks[chunk].objs.length < 150) {
            let obj = {i: getId(chunk), t: "c", x: wmouse.x, y: wmouse.y, s: 10, c: [150, 100, 0, 1]}
            chunks[chunk].objs.push(obj)
            sendMsg({create: [chunk, obj]})
        }
    }

    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [60, 180, 0, 1])

    let cp = {x: Math.floor(player.x/500), y: Math.floor(player.y/500)}
    let rd = {x: 2, y: 2}
    let x2 = 0
    let y2 = 0
    let poses = []
    for (let x = 0; x < rd.x*2; x++) {
        for (let y = 0; y < rd.y*2; y++) {
            x2 = x-rd.x+cp.x
            y2 = y-rd.y+cp.y
            poses.push(x2+","+y2)
            if (!(x2+","+y2 in chunks) && !loadingChunks.includes(x2+","+y2)) {
                loadChunk(x2, y2)
            }
        }
    }

    for (let chunk in chunks) {
        if (poses.includes(chunk)) {
            let obj
            for (let i = 0; i < chunks[chunk].objs.length; i++) {
                obj = chunks[chunk].objs[i]
                if (obj.t == "c") {
                    ui.circle(cx(obj.x), cy(obj.y), obj.s*camera.zoom, obj.c)
                } else if (obj.t == "r") {
                    ui.rect(cx(obj.x), cy(obj.y), obj.w*camera.zoom, obj.h*camera.zoom, obj.c)
                }
            }
        } else {
            delete chunks[chunk]
        }
    }

    camera.x = lerp(camera.x, player.x, delta*10)
    camera.y = lerp(camera.y, player.y, delta*10)
    camera.zoom = lerp(camera.zoom, su*3*tzoom, delta*10)

    ui.circle(cx(player.x), cy(player.y), 15*camera.zoom, [0, 100, 200, 1])

    for (let player in playerData) {
        if (!(player in players)) {
            players[player] = {x: 0, y: 0}
        }
    }

    for (let player in players) {
        if (!(player in playerData)) {
            delete players[player]
        }
    }

    for (let player in players) {
        players[player].x = lerp(players[player].x, playerData[player].x, delta*10)
        players[player].y = lerp(players[player].y, playerData[player].y, delta*10)
        if (Math.sqrt((playerData[player].x - players[player].x)**2 + (playerData[player].y - players[player].y)**2) > 100) {
            players[player].x = playerData[player].x
            players[player].y = playerData[player].y
        }
        ui.circle(cx(players[player].x), cy(players[player].y), 15*camera.zoom, [0, 100, 200, 1])
    }
    
    // hey silver i bet you'll never find this line of code
    // -blazingfish
    // hey blazingfish i found your line of code
    // -silver

    data = {
        x: player.x,
        y: player.y
    }

    input.updateInput()
} 

function getId(chunk) {
    let sid = 9999
    if (chunks[chunk]) {
        let found = true
        while (found) {
            sid++
            found = false
            for (let obj of chunks[chunk].objs) {
                if (obj.i == sid) {
                    found = true
                }
            }
        }
    } else {
        sid++
    }
    return sid
}

function loadChunk(x, y) {
    sendMsg({chunk: x+","+y})
    loadingChunks.push(x+","+y)
}

function genChunk(x, y) {
    let objs = []
    let id = x * 1000000 + y
    if (id == 0) id = 1
    randi = 0
    let amt = rand(id)*50 + 50
    for (let i = 0; i < amt; i++) {
        objs.push({i: objs.length, t: "c", x: rand(id)*500 + x*500, y: rand(id)*500 + 500*y, s: 5, c: [40, 120, 0, 1]})
    }
    amt = rand(id)*1
    for (let i = 0; i < amt; i++) {
        let pos = {x: rand(id)*500 + x*500, y: rand(id)*500 + y*500}
        objs.push({i: objs.length, t: "r", x: pos.x, y: pos.y, w: 100, h: 100, c: [100, 50, 0, 1]})
        objs.push({i: objs.length, t: "r", x: pos.x - 50, y: pos.y, w: 10, h: 100, c: [150, 100, 0, 1]})
        objs.push({i: objs.length, t: "r", x: pos.x + 50, y: pos.y, w: 10, h: 100, c: [150, 100, 0, 1]})
        objs.push({i: objs.length, t: "r", x: pos.x, y: pos.y - 50, w: 100, h: 10, c: [150, 100, 0, 1]})
    }
    amt = rand(id)*5 + 5
    for (let i = 0; i < amt; i++) {
        objs.push({i: objs.length, t: "c", x: rand(id)*500 + x*500, y: rand(id)*500 + 500*y, s: 25, c: [127, 127, 127, 1]})
    }
    chunks[x+","+y] = {objs: objs, grid: []}
}

function cx(x) {
    return (x-camera.x)*camera.zoom+canvas.width/2
}

function cy(y) {
    return (y-camera.y)*camera.zoom+canvas.height/2
}

function srand(seed) {
    let x = Math.abs(Math.sin(seed*3902+7459)*Math.cos(seed*4092+4829)*10000)
	return x - Math.floor(x)
}

let randi = 0
function rand(seed) {
    randi += 1
    return srand(seed*randi)
}

input.checkInputs = (event) => {
    input.cistart()

    input.ciend()
}

requestAnimationFrame(tick)