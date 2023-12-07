
utils.setup()
utils.setStyles()

var su = 0
var delta = 0
var lastTime = 0

var seedT = new ui.TextBox("Seed")
var newSeed = new ui.Button("rect", "New Seed")
newSeed.bgColour = [0, 0, 0, 0.5]

ui.textShadow.bottom = "auto"

function tick(timestamp) {
    requestAnimationFrame(tick)

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()

    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [150, 150, 150, 1])

    ui.text(50*su, 75*su, 75*su, "New Idea")

    seedT.set(canvas.width/2, 100*su, 800*su, 50*su)
    seedT.outlineSize = 15*su
    seedT.hover()
    seedT.draw()

    newSeed.set(canvas.width/2-300*su, 35*su, 200*su, 50*su)
    newSeed.textSize = 35*su

    newSeed.basic()
    newSeed.draw()

    ui.rect(canvas.width/2, 150*su, canvas.width, 5*su, [0, 0, 0, 1])

    input.updateInput()
} 

input.checkInputs = (event) => {
    input.cistart()

    seedT.checkFocus(event)

    input.ciend()
}

requestAnimationFrame(tick)