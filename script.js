
utils.setup()
utils.setStyles()
utils.setGlobals()

var su = 0
var delta = 0
var lastTime = 0

var seedT = new ui.TextBox("Seed")
seedT.text = Math.round(Math.random()*10000000).toString()
var newSeed = new ui.Button("rect", "New Seed")
var generate = new ui.Button("rect", "Generate")
newSeed.bgColour = [0, 0, 0, 0.5]
generate.bgColour = [0, 0, 0, 0.5]

var gameC = new ui.Canvas()

ui.textShadow.bottom = "auto"

var rects = []

function tick(timestamp) {
    requestAnimationFrame(tick)

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()
    input.setGlobals()

    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [150, 150, 150, 1])

    ui.text(50*su, 75*su, 65*su, "New Idea")

    seedT.set(canvas.width/2, 100*su, 800*su, 50*su)
    seedT.outlineSize = 15*su
    seedT.hover()
    seedT.draw()

    newSeed.set(canvas.width/2-300*su, 35*su, 200*su, 50*su)
    newSeed.textSize = 35*su

    newSeed.basic()
    newSeed.draw()

    if (newSeed.hovered() && mouse.lclick) {
        seedT.text = Math.round(Math.random()*10000000).toString()
        newSeed.click()
    }

    generate.set(canvas.width/2+300*su, 35*su, 200*su, 50*su)
    generate.textSize = 35*su

    generate.basic()
    generate.draw()

    if (generate.hovered() && mouse.lclick) {
        generate.click()
        generateSeed(seedT.text)
    }

    ui.rect(canvas.width/2, 150*su, canvas.width, 5*su, [0, 0, 0, 1])

    gameC.set(canvas.width/2, canvas.height/2 + 75*su, canvas.width, canvas.height - 150*su)

    ui.setC(gameC)

    for (let rect of rects) {
        ui.rect(...rect)
    }

    ui.setC()
    
    // hey silver i bet you'll never find this line of code
    // -blazingfish
    // hey blazingfish i found your line of code
    // -silver

    input.updateInput()
} 

function srand(seed) {
    let x = Math.sin(seed*3902+7459)*Math.cos(seed*4092+4829)*10000
	return x - Math.floor(x)
}

var randM = 1

function rand(seed) {
    randM += 1
    return srand((randM-1)*seed)
}

function generateSeed(seed) {
    randM = 1
    rects = []
    let amt = rand(seed)*100
    for (let i = 0; i < amt; i++) {
        rects.push([rand(seed)*500, rand(seed)*500, rand(seed)*50, rand(seed)*50, [rand(seed)*255, rand(seed)*255, rand(seed)*255, rand(seed)]])
    }
}

input.checkInputs = (event) => {
    input.cistart()

    seedT.checkFocus(event)

    input.ciend()
}

requestAnimationFrame(tick)