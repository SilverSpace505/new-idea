
utils.setup()
utils.setStyles()
utils.setGlobals()

var su = 0
var delta = 0
var lastTime = 0

var res = 40
var s = 0

ui.textShadow.bottom = "auto"

var camera = {x: 0, y: 0, zoom: 1}

var player = {x: 0, y: 0}

var players = {}

var chunks = {}
var loadingChunks = []
var tChunks = {}

var setting = []

var tzoom = 1

function isColliding() {
    let offs = [[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10]]
    let ppoints = []
    for (let off of offs) {
        ppoints.push([off, 0])
    }
    for (let chunk in chunks) {
        for (let obj of chunks[chunk].objs) {
            if (obj.co == 1) {
                if (obj.t == "c") {
                    if (Math.sqrt((obj.x-player.x)**2 + (obj.y-player.y)**2) < obj.s+10) {
                        return true
                    }
                } else if (obj.t == "r") {
                    if (player.x+10 > obj.x-obj.w/2 && player.x-10 < obj.x+obj.w/2 &&
                    player.y+10 > obj.y-obj.h/2 && player.y-10 < obj.y+obj.h/2) {
                        return true
                    }
                }
            }
        }
        if (chunk in tChunks) {
            for (let line of tChunks[chunk][0]) {
                for (let ppoint of ppoints) {
                    if (findIntersection(player.x+ppoint[0][0], player.y+ppoint[0][1], player.x+ppoint[0][0], player.y+ppoint[0][1] + 10000, line[0].x, line[0].y, line[1].x, line[1].y)) {
                        ppoint[1] += 1
                    }
                }
                
            }
        }
    }
    for (let ppoint of ppoints) {
        if (ppoint[1] % 2 == 1) return true
    }
    return false
}

function intWeights(v1, w1, v2, w2) {
    let total = w1+w2
    w1 /= total
    w2 /= total
    return v1*w1 + v2*w2
}

function getVal(x, y) {
    x = Math.round(x)
    y = Math.round(y)
    let cp = [Math.floor(x/res), Math.floor(y/res)]
    let cip = [x-cp[0]*res, y-cp[1]*res]
    let chunk = cp[0]+","+cp[1]
    if (chunk in chunks) {
        return chunks[chunk].grid[cip[0]*res+cip[1]]
    } else {
        return 0
    }
}

function setVal(x, y, v) {
    let cp = [Math.floor(x/res), Math.floor(y/res)]
    let cip = [x-cp[0]*res, y-cp[1]*res]
    let chunk = cp[0]+","+cp[1]
    if (chunk in chunks) {
        chunks[chunk].grid[cip[0]*res+cip[1]] = v
    }
    return [cp, cip]
}

function getC(x, y) {
    let cp = [Math.floor(x/res), Math.floor(y/res)]
    let cip = [x-cp[0]*res, y-cp[1]*res]
    return [cp, cip]
}

function line(vec1, vec2) {
    ctx.beginPath()
    ctx.moveTo(cx(vec1.x), cy(vec1.y))
    ctx.lineTo(cx(vec2.x), cy(vec2.y))
    ctx.stroke()
}

function tri(vec1, vec2, vec3) {
    ctx.beginPath()
    ctx.moveTo(cx(vec1.x), cy(vec1.y))
    ctx.lineTo(cx(vec2.x), cy(vec2.y))
    ctx.lineTo(cx(vec3.x), cy(vec3.y))
    ctx.lineTo(cx(vec1.x), cy(vec1.y))
    ctx.fill()
}

function poly(...points) {
    ctx.beginPath()
    ctx.moveTo(cx(points[0].x), cy(points[0].y))
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(cx(points[i].x), cy(points[i].y))
    }
    ctx.lineTo(cx(points[0].x), cy(points[0].y))
    ctx.stroke()
    ctx.fill()
}

function constructTerrain() {
    tChunks = {}
    for (let chunk in chunks) {
        tChunks[chunk] = constructChunk(chunk)
    }
}

function constructChunk(chunk) {
    let lines = []
    let polys = []
    let sp = chunk.split(","); sp[0] = parseInt(sp[0]); sp[1] = parseInt(sp[1])
    
    let values = []
    let values2 = []
    let min = 0.5
    let id = 0
    let wx = 0
    let wy = 0
    let smoothing = !keys["Space"]
    for (let x = 0; x < res; x++) {
        for (let y = 0; y < res; y++) {
            // ui.rect(cx(x*25 + sp[0]*500 + 12.5), cy(y*25 + sp[1]*500 + 12.5), 20*camera.zoom, 20*camera.zoom, [127, 127, 127, 0.5])
            wx = x+sp[0]*res
            wy = y+sp[1]*res
            values = [getVal(wx, wy), getVal(wx+1, wy), getVal(wx+1, wy+1), getVal(wx, wy+1)]
            values2 = [values[0] > min ? 1 : 0, values[1] > min ? 1 : 0, values[2] > min ? 1 : 0, values[3] > min ? 1 : 0]
            // values[0] += min/2; values[1] += min/2; values[2] += min/2; values[3] += min/2
            id = values2[0]*1 + values2[1]*2 + values2[2]*4 + values2[3]*8

            let a = {}; let b = {}; let c = {}; let d = {}
            if (smoothing) {
                a = {x: x*s + sp[0]*500 + intWeights(0, values[1], s, values[0]), y: y*s + sp[1]*500}
                b = {x: x*s + sp[0]*500 + s, y: y*s + sp[1]*500 + intWeights(0, values[2], s, values[1])}
                c = {x: x*s + sp[0]*500 + intWeights(0, values[2], s, values[3]), y: y*s + sp[1]*500 + s}
                d = {x: x*s + sp[0]*500, y: y*s + sp[1]*500 + intWeights(0, values[3], s, values[0])}
            } else {
                a = {x: x*s + sp[0]*500 + s/2, y: y*s + sp[1]*500}
                b = {x: x*s + sp[0]*500 + s, y: y*s + sp[1]*500 + s/2}
                c = {x: x*s + sp[0]*500 + s/2, y: y*s + sp[1]*500 + s}
                d = {x: x*s + sp[0]*500, y: y*s + sp[1]*500 + s/2}
            }

            let ac = {x: x*s + sp[0]*500, y: y*s + sp[1]*500}
            let bc = {x: x*s + sp[0]*500 + s, y: y*s + sp[1]*500}
            let cc = {x: x*s + sp[0]*500 + s, y: y*s + sp[1]*500 + s}
            let dc = {x: x*s + sp[0]*500, y: y*s + sp[1]*500 + s}

            ctx.lineJoin = "round"
            ctx.lineWidth = 1*camera.zoom
            ctx.strokeStyle = "darkgreen"
            ctx.fillStyle = "darkgreen"

            switch (id) {
                case 0:
                    break
                case 1:
                    lines.push([d, a])
                    polys.push([d, ac, a])
                    break
                case 2:
                    lines.push([a, b])
                    polys.push([a, bc, b])
                    break
                case 3:
                    lines.push([d, b])
                    polys.push([ac, bc, b, d])
                    break
                case 4:
                    lines.push([b, c])
                    polys.push([b, cc, c])
                    break
                case 5:
                    lines.push([a, b])
                    lines.push([d, c])
                    polys.push([d, ac, a, b, cc, c])
                    break
                case 6:
                    lines.push([a, c])
                    polys.push([bc, cc, c, a])
                    break
                case 7:
                    lines.push([d, c])
                    polys.push([ac, bc, cc, c, d])
                    break
                case 8:
                    lines.push([d, c])
                    polys.push([c, dc, d])
                    break
                case 9:
                    lines.push([a, c])
                    polys.push([ac, a, c, dc])
                    break
                case 10:
                    lines.push([a, d])
                    lines.push([b, c])
                    polys.push([d, a, bc, b, c, dc])
                    break
                case 11:
                    lines.push([b, c])
                    polys.push([dc, ac, bc, b, c])
                    break
                case 12:
                    lines.push([d, b])
                    polys.push([dc, cc, b, d])
                    break
                case 13:
                    lines.push([a, b])
                    polys.push([ac, a, b, cc, dc])
                    break
                case 14:
                    lines.push([a, d])
                    polys.push([a, d, dc, cc, bc])
                    break
                case 15:
                    polys.push([ac, bc, cc, dc])
                    break
            }
        }
    }
    return [lines, polys]
}

setInterval(() => {
    input.setGlobals()
    let wmouse = {x: (mouse.x - canvas.width/2)/camera.zoom + camera.x, y: (mouse.y - canvas.height/2)/camera.zoom + camera.y}
    if (mouse.ldown && !keys["ShiftLeft"]) {
        let ro = {x: Math.round(wmouse.x/s)*s, y: Math.round(wmouse.y/s)*s}
        let offs = []
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                offs.push([x-5, y-5])
            }
        }
        for (let off of offs) {
            let d = Math.sqrt((ro.x+off[0]*s-wmouse.x)**2 + (ro.y+off[1]*s-wmouse.y)**2)/3.5
            let v = getVal(ro.x/s + off[0], ro.y/s + off[1])
            if (d/s < v) {
                let ps = getC(ro.x/s + off[0], ro.y/s + off[1])
                setting.push([ro.x/s + off[0], ro.y/s + off[1], d/s, 0])
                sendMsg({set: [ps[0][0]+","+ps[0][1], ps[1][0], ps[1][1], d/s]})
            }
        }
    }

    if (mouse.rdown && !keys["ShiftLeft"] && Math.sqrt((wmouse.x-player.x)**2 + (wmouse.y-player.y)**2) > 35) {
        let ro = {x: Math.round(wmouse.x/s)*s, y: Math.round(wmouse.y/s)*s}
        let offs = []
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                offs.push([x-5, y-5])
            }
        }
        for (let off of offs) {
            let d = s - Math.sqrt((ro.x+off[0]*s-wmouse.x)**2 + (ro.y+off[1]*s-wmouse.y)**2)/3.5
            let v = getVal(ro.x/s + off[0], ro.y/s + off[1])
            if (d/s > v) {
                let ps = getC(ro.x/s + off[0], ro.y/s + off[1])
                setting.push([ro.x/s + off[0], ro.y/s + off[1], d/s, 0])
                sendMsg({set: [ps[0][0]+","+ps[0][1], ps[1][0], ps[1][1], d/s]})
            }
        }
    }
}, 1000/10)

function tick(timestamp) {
    requestAnimationFrame(tick)

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()
    input.setGlobals()

    s = 500/res

    for (let i = 0; i < setting.length; i++) {
        let set = setting[i]
        let v = getVal(set[0], set[1])
        set[3] += delta
        setVal(set[0], set[1], lerp(v, set[2], delta*20))
        if (Math.abs(v - set[2]) < 0.01 || set[3] > 0.1) {
            setVal(set[0], set[1], set[2])
            setting.splice(i, 1)
            i--
        }
    }
    

    let orig = isColliding()

    constructTerrain()

    let last = {x: player.x, y: player.y}
    if (keys["KeyW"]) {
        player.y -= 150*delta
    }
    if (keys["KeyS"]) {
        player.y += 150*delta
    }

    // if (!orig && isColliding()) {
    //     player.y = last.y
    // }

    if (keys["KeyA"]) {
        player.x -= 150*delta
    }
    if (keys["KeyD"]) {
        player.x += 150*delta
    }

    // if (!orig && isColliding()) {
    //     player.x = last.x
    // }

    fixCollision()

    if (keys["Minus"]) {
        tzoom *= 0.995
    }
    if (keys["Equal"]) {
        tzoom *= 1.005
    }

    let wmouse = {x: (mouse.x - canvas.width/2)/camera.zoom + camera.x, y: (mouse.y - canvas.height/2)/camera.zoom + camera.y}
    if (mouse.lclick && keys["ShiftLeft"]) {
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

    if (mouse.rclick && keys["ShiftLeft"]) {
        let wcmouse = {x: Math.floor(wmouse.x/500), y: Math.floor(wmouse.y/500)}
        let chunk = wcmouse.x+","+wcmouse.y
        if (chunk in chunks && chunks[chunk].objs.length < 150) {
            let obj = {i: getId(chunk), t: "c", co: 1, x: wmouse.x, y: wmouse.y, s: 10, c: [150, 100, 0, 1]}
            chunks[chunk].objs.push(obj)
            sendMsg({create: [chunk, obj]})
        }
    }
    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [60, 180, 0, 1])

    let cp = {x: Math.round(player.x/500), y: Math.round(player.y/500)}
    let rd = {x: 1, y: 1}
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
            if (chunk in tChunks) {
                ctx.lineJoin = "round"
                ctx.lineWidth = 1*camera.zoom
                ctx.strokeStyle = "darkgreen"
                ctx.fillStyle = "darkgreen"
                for (let line2 of tChunks[chunk][0]) {
                    line(...line2)
                }
                for (let poly2 of tChunks[chunk][1]) {
                    poly(...poly2)
                }
            }
            
            // let sp = chunk.split(","); sp[0] = parseInt(sp[0]); sp[1] = parseInt(sp[1])
            // if (keys["KeyE"]) {
            //     for (let x = 0; x < res; x++) {
            //         for (let y = 0; y < res; y++) {
            //             let i = x*res+y
            //             let v = getVal(x+sp[0]*res, y+sp[1]*res)
            //             if (v < 0) console.log("OH NO")
            //             if (true) {
                            
            //                 ui.circle(cx(sp[0]*500 + x*s), cy(sp[1]*500 + y*s), 5*camera.zoom, [v*255, v*255, v*255, 1])
            //             }
            //         }
            //     }
            // }
            
            // let values = []
            // let values2 = []
            // let min = 0.5
            // let id = 0
            // let wx = 0
            // let wy = 0
            // let smoothing = !keys["Space"]
            // for (let x = 0; x < res; x++) {
            //     for (let y = 0; y < res; y++) {
            //         // ui.rect(cx(x*25 + sp[0]*500 + 12.5), cy(y*25 + sp[1]*500 + 12.5), 20*camera.zoom, 20*camera.zoom, [127, 127, 127, 0.5])
            //         wx = x+sp[0]*res
            //         wy = y+sp[1]*res
            //         values = [getVal(wx, wy), getVal(wx+1, wy), getVal(wx+1, wy+1), getVal(wx, wy+1)]
            //         values2 = [values[0] > min ? 1 : 0, values[1] > min ? 1 : 0, values[2] > min ? 1 : 0, values[3] > min ? 1 : 0]
            //         // values[0] += min/2; values[1] += min/2; values[2] += min/2; values[3] += min/2
            //         id = values2[0]*1 + values2[1]*2 + values2[2]*4 + values2[3]*8

            //         let a = {}; let b = {}; let c = {}; let d = {}
            //         if (smoothing) {
            //             a = {x: x*s + sp[0]*500 + intWeights(0, values[1], s, values[0]), y: y*s + sp[1]*500}
            //             b = {x: x*s + sp[0]*500 + s, y: y*s + sp[1]*500 + intWeights(0, values[2], s, values[1])}
            //             c = {x: x*s + sp[0]*500 + intWeights(0, values[2], s, values[3]), y: y*s + sp[1]*500 + s}
            //             d = {x: x*s + sp[0]*500, y: y*s + sp[1]*500 + intWeights(0, values[3], s, values[0])}
            //         } else {
            //             a = {x: x*s + sp[0]*500 + s/2, y: y*s + sp[1]*500}
            //             b = {x: x*s + sp[0]*500 + s, y: y*s + sp[1]*500 + s/2}
            //             c = {x: x*s + sp[0]*500 + s/2, y: y*s + sp[1]*500 + s}
            //             d = {x: x*s + sp[0]*500, y: y*s + sp[1]*500 + s/2}
            //         }

            //         let ac = {x: x*s + sp[0]*500, y: y*s + sp[1]*500}
            //         let bc = {x: x*s + sp[0]*500 + s, y: y*s + sp[1]*500}
            //         let cc = {x: x*s + sp[0]*500 + s, y: y*s + sp[1]*500 + s}
            //         let dc = {x: x*s + sp[0]*500, y: y*s + sp[1]*500 + s}

            //         ctx.lineJoin = "round"
            //         ctx.lineWidth = 1*camera.zoom
            //         ctx.strokeStyle = "darkgreen"
            //         ctx.fillStyle = "darkgreen"

            //         switch (id) {
            //             case 0:
            //                 break
            //             case 1:
            //                 // line(d, a)
            //                 poly(d, ac, a)
            //                 break
            //             case 2:
            //                 // line(a, b)
            //                 poly(a, bc, b)
            //                 break
            //             case 3:
            //                 // line(d, b)
            //                 poly(ac, bc, b, d)
            //                 break
            //             case 4:
            //                 // line(b, c)
            //                 poly(b, cc, c)
            //                 break
            //             case 5:
            //                 // line(a, b)
            //                 // line(d, c)
            //                 poly(d, ac, a, b, cc, c)
            //                 break
            //             case 6:
            //                 // line(a, c)
            //                 poly(bc, cc, c, a)
            //                 break
            //             case 7:
            //                 // line(d, c)
            //                 poly(ac, bc, cc, c, d)
            //                 break
            //             case 8:
            //                 // line(d, c)
            //                 poly(c, dc, d)
            //                 break
            //             case 9:
            //                 // line(a, c)
            //                 poly(ac, a, c, dc)
            //                 break
            //             case 10:
            //                 // line(a, d)
            //                 // line(b, c)
            //                 poly(d, a, bc, b, c, dc)
            //                 break
            //             case 11:
            //                 // line(b, c)
            //                 poly(dc, ac, bc, b, c)
            //                 break
            //             case 12:
            //                 // line(d, b)
            //                 poly(dc, cc, b, d)
            //                 break
            //             case 13:
            //                 // line(a, b)
            //                 poly(ac, a, b, cc, dc)
            //                 break
            //             case 14:
            //                 // line(a, d)
            //                 poly(a, d, dc, cc, bc)
            //                 break
            //             case 15:
            //                 poly(ac, bc, cc, dc)
            //                 break
            //         }
            //     }
            // }
        } else {
            delete chunks[chunk]
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

    ui.circle(cx(player.x), cy(player.y), 10*camera.zoom, [0, 100, 200, orig ? 0.5 : 1])

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
        ui.circle(cx(players[player].x), cy(players[player].y), 10*camera.zoom, [0, 100, 200, 1])
    }

    camera.x = lerp(camera.x, player.x, delta*10)
    camera.y = lerp(camera.y, player.y, delta*10)
    camera.zoom = lerp(camera.zoom, su*3*tzoom, delta*10)
    
    // hey silver i bet you'll never find player line of code
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
        objs.push({i: objs.length, t: "c", co: 0, x: rand(id)*500 + x*500, y: rand(id)*500 + 500*y, s: 5, c: [40, 120, 0, 1]})
    }
    amt = rand(id)*1
    for (let i = 0; i < amt; i++) {
        let pos = {x: rand(id)*500 + x*500, y: rand(id)*500 + y*500}
        objs.push({i: objs.length, t: "r", co: 0, x: pos.x, y: pos.y, w: 100, h: 100, c: [100, 50, 0, 1]})
        objs.push({i: objs.length, t: "r", co: 1, x: pos.x - 50, y: pos.y, w: 10, h: 100, c: [150, 100, 0, 1]})
        objs.push({i: objs.length, t: "r", co: 1, x: pos.x + 50, y: pos.y, w: 10, h: 100, c: [150, 100, 0, 1]})
        objs.push({i: objs.length, t: "r", co: 1, x: pos.x, y: pos.y - 50, w: 100, h: 10, c: [150, 100, 0, 1]})
    }
    amt = rand(id)*5 + 5
    for (let i = 0; i < amt; i++) {
        objs.push({i: objs.length, t: "c", co: 1, x: rand(id)*500 + x*500, y: rand(id)*500 + 500*y, s: 25, c: [127, 127, 127, 1]})
    }
    let grid = []
    let wx = 0
    let wy = 0
    for (let gx = 0; gx < res; gx++) {
        for (let gy = 0; gy < res; gy++) {
            wx = gx+x*res
            wy = gy+y*res
            grid.push( (((Math.sin(wx/10)+1)/2) * ((Math.sin(wy/10)+1)/2)) )
            // console.log((Math.sin(wx/10)+1)/2*((Math.cos(wy/10)+1)/2))
            // grid.push(((Math.sin(wx/10)+1)/2+(Math.cos(wy/10)+1)/2)/2)
        }
    }
    chunks[x+","+y] = {objs: objs, grid: grid}
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

function findIntersection(a,b,c,d,p,q,r,s) {
    var det, gamma, lambda
    det = (c - a) * (s - q) - (r - p) * (d - b)
    if (det === 0) {
        return false
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)
    }
}

var fixDistance = 0

function fixCollision() {
    let splits = 16
    let collided = false
    let moved = 0
    let solutions = []
    // let start = new Date().getTime()
    while (moved < 500) {
        solutions = []
        for (let angleI = 0; angleI < splits; angleI++) {
            let angle = Math.PI*2 / splits * angleI
            player.x += Math.sin(angle)*fixDistance
            player.y += Math.cos(angle)*fixDistance
            if (!isColliding()) {
                solutions.push(angleI)
                // player.fixDistance = 0
                // return collided
            }
            player.x -= Math.sin(angle)*fixDistance
            player.y -= Math.cos(angle)*fixDistance
            collided = true
        }

        if (solutions.length > 0) {
            let angle = Math.PI*2 / splits * solutions[0]
            player.x += Math.sin(angle)*fixDistance
            player.y += Math.cos(angle)*fixDistance
            fixDistance = 0
            return
        }

        fixDistance += 0.1
        moved += 0.1
        // console.log(start, Date.now(), Date.now()-start)
    }
    return collided
}

requestAnimationFrame(tick)