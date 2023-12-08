
utils.setup()
utils.setStyles()
utils.setGlobals()

var su = 0
var delta = 0
var lastTime = 0

ui.textShadow.bottom = "auto"

var camera = {x: 0, y: 0, zoom: 1}

var player = {x: 0, y: 0}

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

    ui.circle(cx(player.x), cy(player.y), 50*su*camera.zoom, [0, 0, 0, 1], {sangle: Math.PI})
    
    // hey silver i bet you'll never find this line of code
    // -blazingfish
    // hey blazingfish i found your line of code
    // -silver

    input.updateInput()
} 

function cx(x) {
    return (x-camera.x)*camera.zoom+canvas.width/2
}

function cy(y) {
    return (y-camera.y)*camera.zoom+canvas.height/2
}

function srand(seed) {
    let x = Math.sin(seed*3902+7459)*Math.cos(seed*4092+4829)*10000
	return x - Math.floor(x)
}

input.checkInputs = (event) => {
    input.cistart()

    input.ciend()
}

requestAnimationFrame(tick)