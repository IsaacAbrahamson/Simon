'use strict'

let simonSeries   = []
let currentSeries = []
let simonTurn     = true
let gameOn        = false
let strict        = false
let currentBtn    = null
let originalColor = ''
let btnDown       = false
let series        = 0

// sounds
const fail    = new Audio('sounds/no.mp3')
const intro   = new Audio('sounds/intro.mp3')
const context = new AudioContext()
const note      = context.createOscillator()
note.start(0) // reset note

const delay = time => new Promise(resolve => setTimeout(resolve, time))

function toggleStrict() {
  if (!gameOn) return
  strict = !strict
  strict ? $('.light').css('background-color', 'red') : $('.light').css('background-color', 'darkred')
}

function switchUser() {
  if (simonTurn) {
    simonTurn = false
    console.log('Your Turn')
  } else {
    simonTurn = true
    console.log("Simon's Turn")
  }
}

function playSound() {
  switch (currentBtn) {
    case '#green':
      note.frequency.value = 240
      break
    case '#red':
      note.frequency.value = 301
      break
    case '#blue':
      note.frequency.value = 318
      break
    case '#yellow':
      note.frequency.value = 360
  }
  note.connect(context.destination)
}

function highlightStart() {
  playSound()
  originalColor = $(currentBtn).css("background-color")
  var newColor = tinycolor(originalColor).brighten(15)
  $(currentBtn).css("background-color", newColor)
}

function highlightStop() {
  note.disconnect()
  $(currentBtn).css("background-color", originalColor)
  currentBtn = null
  originalColor = ''
}

function checkTimelimit() {
  var timeLimit = 750
  var timer = setInterval(function () {
    if (!currentBtn) {
      if (!timeLimit--) {
        clearInterval(timer)
        gameOver(false)
        return
      }
    } else {
      clearInterval(timer)
    }
  }, 1)
}

// num paramater is for recursive calling. For normal function call it will de defaulted to 0
const showSeries = async (num = 0) => {
  // length of each button press should be faster after 10 series
  const btnLength = series >= 10 ? 250 : 600

  if (num < simonSeries.length) {
    currentBtn = simonSeries[num]

    highlightStart()
    await delay(btnLength)
    highlightStop()

    // short delay and then highlight next button in series
    await delay(btnLength / 1.5)
    showSeries(++num)
  } else {
    switchUser()
    checkTimelimit()
  }
}

const playerWins = () => {
  if (series == 20) {
    gameOver(true)
    return true
  } else return false
}

const newGame = async () => {
  simonSeries = []
  currentSeries = []
  simonTurn = true
  gameOn = true
  currentBtn = null
  originalColor = ''
  btnDown = false
  series = 0

  $('#score h6').removeClass('off')
  $('#score h6').addClass('on')
  $('#score h6').html('--')
  intro.play()

  await delay(250)
  $('#score h6').html('')

  await delay(250)
  $('#score h6').html('--')

  await delay(2250) // wait for intro sound to finish
  simonSeries.push(newColor())
  showSeries()
}

async function gameOver(win) {
  if (win) {
    $('#score h6').html('GG')
    await delay(1500)
    newGame()
  } else {
    fail.play()
    $('#score h6').html('!!')

    await delay(250)
    $('#score h6').html('')

    await delay(250)
    $('#score h6').html('!!')
    switchUser()

    if (strict) {
      await delay(1500)
      newGame()
    } else {
      currentSeries = []

      await delay(1500)
      $('#score h6').html('--')

      await delay(1500)
      showSeries()
    }
  }
}

const updateScore = () => {
  series = simonSeries.length
  if (series) {
    $('#score h6').html(series)
  }
}

const newColor = () => {
  const n = Math.floor(Math.random() * (4 - 1 + 1) + 1) // random number 1-4
  switch (n) {
    case 1: return '#green'
    case 2: return '#red'
    case 3: return '#blue'
    case 4: return '#yellow'
  }
}

const nextSeries = async () => {
  simonSeries.push(newColor())
  currentSeries = []
  switchUser()
  await delay(1500)
  showSeries()
}

function checkSeries() {
  for (let i = 0; i < currentSeries.length; i++) {
    if (currentSeries[i] !== simonSeries[i]) {
      gameOver(false)
      return
    }
  }

  if (currentSeries.length !== simonSeries.length) {
    checkTimelimit()
    return
  }

  updateScore()
  if (!playerWins()) nextSeries()
}

$(document).ready(function () {
  $('#start').click(() => newGame())
  $('#strict').click(() => toggleStrict())

  // disable right click
  $("html").on("contextmenu", () => false)

  $('.simon-btn').mousedown(function (e) {
    if (simonTurn || !gameOn || e.which == 3 || currentBtn) {
      return
    }
    currentBtn = '#' + this.id
    btnDown = true
    currentSeries.push(currentBtn)
    highlightStart(currentBtn)

    var timer = 250
    var btnHold = setInterval(function () {
      // user holds button too long
      if (!timer) {
        btnDown = false
        clearInterval(btnHold)
        highlightStop()
        checkSeries()
        timer = 400
        return
      }
      // user releases button
      if (!btnDown) {
        clearInterval(btnHold)
        highlightStop()
        checkSeries()
        timer = 400
        return
      }
      timer--
    }, 1)
  }).bind('mouseup mouseleave', function () {
    if (!simonTurn && gameOn && currentBtn) {
      btnDown = false
    }
  })

})
