import './style.css'

type Side = 'player' | 'enemy'
type ManeuverId = 'straight' | 'extend' | 'climb' | 'dive' | 'bank-left' | 'bank-right' | 'tight-left' | 'tight-right' | 'immelmann' | 'split-s'
type DamageId = 'engine' | 'controls' | 'pilot' | 'fuel' | 'guns' | 'structure' | 'fire'

type Maneuver = { id: ManeuverId; name: string; short: string; move: number; turn: number; climb: number; note: string }
type Aircraft = { id: string; name: string; nation: string; role: string; hp: number; agility: number; gunnery: number; climb: number; color: string; deck: ManeuverId[]; trait: string; traitNote: string }
type Damage = { id: DamageId; title: string; text: string; speed: number; turn: number; aim: number; hp: number; fire?: boolean }
type ActiveDamage = Damage & { turn: number }
type Plane = { side: Side; aircraft: Aircraft; x: number; y: number; heading: number; altitude: number; hp: number; selected?: ManeuverId; locked?: ManeuverId; damages: ActiveDamage[] }

const app = document.querySelector<HTMLDivElement>('#app')!
const boardSize = { width: 940, height: 570 }

const maneuvers: Record<ManeuverId, Maneuver> = {
  straight: { id: 'straight', name: 'Level Flight', short: 'LF', move: 122, turn: 0, climb: 0, note: 'Reliable, no altitude change.' },
  extend: { id: 'extend', name: 'Full Throttle', short: 'FT', move: 156, turn: 0, climb: -8, note: 'Fast escape or closing run.' },
  climb: { id: 'climb', name: 'Climbing Run', short: 'CL', move: 92, turn: 0, climb: 52, note: 'Gain altitude, lose momentum.' },
  dive: { id: 'dive', name: 'Diving Run', short: 'DV', move: 146, turn: 0, climb: -54, note: 'Build speed through altitude.' },
  'bank-left': { id: 'bank-left', name: 'Bank Left', short: 'BL', move: 106, turn: -28, climb: 0, note: 'Broad, energy-efficient turn.' },
  'bank-right': { id: 'bank-right', name: 'Bank Right', short: 'BR', move: 106, turn: 28, climb: 0, note: 'Broad, energy-efficient turn.' },
  'tight-left': { id: 'tight-left', name: 'Hard Left', short: 'HL', move: 76, turn: -58, climb: 0, note: 'High-angle turning attack.' },
  'tight-right': { id: 'tight-right', name: 'Hard Right', short: 'HR', move: 76, turn: 58, climb: 0, note: 'High-angle turning attack.' },
  immelmann: { id: 'immelmann', name: 'Immelmann', short: 'IM', move: 72, turn: 180, climb: 64, note: 'Reverse direction; needs altitude.' },
  'split-s': { id: 'split-s', name: 'Split-S', short: 'SS', move: 116, turn: 180, climb: -72, note: 'Reverse direction in a dive.' },
}

const aircraft: Aircraft[] = [
  { id: 'spitfire', name: 'Supermarine Spitfire', nation: 'United Kingdom', role: 'Turn fighter', hp: 7, agility: 5, gunnery: 4, climb: 4, color: '#72d7ff', deck: ['straight','straight','extend','climb','dive','bank-left','bank-right','tight-left','tight-right','immelmann'], trait: 'Graceful turn', traitNote: 'Hard turns retain +10% firing accuracy.' },
  { id: 'mustang', name: 'P-51 Mustang', nation: 'United States', role: 'Energy fighter', hp: 8, agility: 3, gunnery: 5, climb: 4, color: '#ffd36a', deck: ['straight','straight','extend','extend','climb','dive','bank-left','bank-right','tight-left','tight-right','split-s'], trait: 'High velocity', traitNote: 'Full Throttle adds 18 movement.' },
  { id: 'hayate', name: 'Ki-84 Hayate', nation: 'Japan', role: 'Versatile interceptor', hp: 6, agility: 4, gunnery: 4, climb: 5, color: '#ff8d74', deck: ['straight','extend','climb','climb','dive','bank-left','bank-right','tight-left','tight-right','immelmann','split-s'], trait: 'Rapid climb', traitNote: 'Climbing Run gains an extra 16 altitude.' },
  { id: 'bf109', name: 'Bf 109 G', nation: 'Germany', role: 'Climbing fighter', hp: 7, agility: 4, gunnery: 4, climb: 5, color: '#9fbe80', deck: ['straight','extend','climb','climb','dive','bank-left','bank-right','tight-left','tight-right','immelmann'], trait: 'Vertical fighter', traitNote: 'Immelmann costs 22 less movement.' },
]

const damages: Damage[] = [
  { id: 'engine', title: 'Engine Roughness', text: 'Power fades and the airframe shudders.', speed: .14, turn: 0, aim: 0, hp: 1 },
  { id: 'controls', title: 'Control Damage', text: 'Your next turn is wider and slower.', speed: 0, turn: 16, aim: 0, hp: 1 },
  { id: 'pilot', title: 'Pilot Wounded', text: 'Aim is compromised.', speed: 0, turn: 0, aim: .15, hp: 1 },
  { id: 'fuel', title: 'Fuel Line Hit', text: 'Fuel pressure reduces speed.', speed: .09, turn: 0, aim: 0, hp: 1 },
  { id: 'guns', title: 'Gun Feed Jam', text: 'Ammunition feed is unreliable.', speed: 0, turn: 0, aim: .2, hp: 1 },
  { id: 'structure', title: 'Wing Structure', text: 'The airframe is badly shaken.', speed: .05, turn: 10, aim: 0, hp: 2 },
  { id: 'fire', title: 'Fuel Fire', text: 'A fire is burning in the fuselage!', speed: .08, turn: 0, aim: .08, hp: 1, fire: true },
]

let phase: 'setup' | 'planning' | 'result' | 'gameover' = 'setup'
let turn = 1
let log: string[] = []
let damageDeck: Damage[] = []
let message = 'Choose a fighter for each pilot, then begin the engagement.'
let player: Plane = makePlane('player', aircraft[0])
let enemy: Plane = makePlane('enemy', aircraft[3])

function makePlane(side: Side, craft: Aircraft): Plane {
  return { side, aircraft: craft, x: side === 'player' ? 160 : 780, y: side === 'player' ? 370 : 215, heading: side === 'player' ? 0 : 180, altitude: side === 'player' ? 320 : 290, hp: craft.hp, damages: [] }
}
function shuffle<T>(items: T[]) { const copy = [...items]; for (let i = copy.length - 1; i; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]] }; return copy }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function norm(n: number) { return ((n % 360) + 360) % 360 }
function rad(n: number) { return n * Math.PI / 180 }
function angleGap(a: number, b: number) { const gap = Math.abs(norm(a) - norm(b)); return gap > 180 ? 360 - gap : gap }
function sum(plane: Plane, key: 'speed' | 'turn' | 'aim') { return plane.damages.reduce((n, d) => n + d[key], 0) }
function craftById(id: string) { return aircraft.find(c => c.id === id)! }
function planeFor(side: Side) { return side === 'player' ? player : enemy }

app.innerHTML = `
  <main class="shell">
    <header class="masthead"><div><p class="kicker">Original tabletop-style PC dogfight</p><h1>Skyborne Tactics</h1><p class="lede">Simultaneous maneuver planning, altitude, forward arcs, and critical damage for two pilots at one screen.</p></div><div class="turn-badge" id="turn-badge">SETUP</div></header>
    <section class="command-bar panel" id="command-bar"></section>
    <section class="game-grid"><aside class="pilot-panel panel" id="player-panel"></aside><section class="board-panel panel"><div class="board-head"><span>TACTICAL MAP</span><span id="range-readout">Range —</span></div><div id="board"></div><div class="legend"><span><i class="cyan"></i>Blue pilot</span><span><i class="amber"></i>Amber pilot</span><span>Altitude creates vertical separation</span></div></section><aside class="pilot-panel panel" id="enemy-panel"></aside></section>
    <section class="planning panel" id="planning"></section>
    <section class="lower-grid"><article class="panel"><h2>Engagement rules</h2><ul class="rules"><li>Both pilots lock a maneuver before movement.</li><li>Move, then turn; altitude limits shooting.</li><li>Fire through the 72° forward arc at short range.</li><li>Hits draw a random damage card with persistent effects.</li></ul></article><article class="panel log-panel"><h2>Combat radio</h2><ol id="log"></ol></article></section>
  </main>`

const commandBar = document.querySelector<HTMLDivElement>('#command-bar')!
const playerPanel = document.querySelector<HTMLDivElement>('#player-panel')!
const enemyPanel = document.querySelector<HTMLDivElement>('#enemy-panel')!
const planning = document.querySelector<HTMLDivElement>('#planning')!
const board = document.querySelector<HTMLDivElement>('#board')!
const rangeReadout = document.querySelector<HTMLSpanElement>('#range-readout')!
const turnBadge = document.querySelector<HTMLDivElement>('#turn-badge')!
const logList = document.querySelector<HTMLOListElement>('#log')!

function render() { renderCommand(); renderPlanePanel(playerPanel, player); renderPlanePanel(enemyPanel, enemy); renderPlanning(); renderBoard(); renderLog() }

function renderCommand() {
  const bothLocked = Boolean(player.locked && enemy.locked)
  commandBar.innerHTML = phase === 'setup' ? `<div><strong>Flight selection</strong><span> Each pilot may fly any listed aircraft.</span></div><button id="start">Start dogfight</button>` : `<div><strong>${phase === 'gameover' ? 'Engagement complete' : `Turn ${turn} · ${phase === 'planning' ? 'Planning phase' : 'Resolution complete'}`}</strong><span> ${message}</span></div><div class="command-actions">${phase === 'planning' && bothLocked ? '<button id="resolve">Resolve locked maneuvers</button>' : ''}${phase === 'result' ? '<button id="next">Begin next turn</button>' : ''}<button class="quiet" id="restart">New engagement</button></div>`
  document.querySelector<HTMLButtonElement>('#start')?.addEventListener('click', startGame)
  document.querySelector<HTMLButtonElement>('#resolve')?.addEventListener('click', resolveTurn)
  document.querySelector<HTMLButtonElement>('#next')?.addEventListener('click', nextTurn)
  document.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', reset)
}

function statDots(count: number) { return `<span class="dots">${Array.from({length: 5}, (_, i) => `<b class="${i < count ? 'on' : ''}"></b>`).join('')}</span>` }
function renderPlanePanel(target: HTMLElement, plane: Plane) {
  const label = plane.side === 'player' ? 'BLUE PILOT' : 'AMBER PILOT'
  const hitDots = Array.from({ length: plane.aircraft.hp }, (_, i) => `<i class="hp-dot ${i < plane.hp ? 'live' : ''}"></i>`).join('')
  target.innerHTML = `<p class="side-label ${plane.side}">${label}</p><div class="plane-name"><h2>${plane.aircraft.name}</h2><span>${plane.aircraft.nation}</span></div><p class="role">${plane.aircraft.role}</p><div class="stat-row"><span>Integrity</span><span class="hp">${hitDots}</span></div><div class="stat-row"><span>Agility</span>${statDots(plane.aircraft.agility)}</div><div class="stat-row"><span>Gunnery</span>${statDots(plane.aircraft.gunnery)}</div><div class="stat-row"><span>Climb</span>${statDots(plane.aircraft.climb)}</div><div class="alt-read">ALT ${plane.altitude} m <span>HDG ${Math.round(plane.heading)}°</span></div><div class="trait"><b>${plane.aircraft.trait}</b><span>${plane.aircraft.traitNote}</span></div>${plane.damages.length ? `<div class="damage-stack"><p>DAMAGE</p>${plane.damages.map(d => `<div class="damage"><b>${d.title}</b><span>${d.text}</span></div>`).join('')}</div>` : '<p class="clean">No persistent damage</p>'}`
}

function renderPlanning() {
  if (phase === 'setup') { planning.innerHTML = `<div class="selection-wrap"><div class="section-copy"><p class="kicker">Choose aircraft</p><h2>Build the flight</h2><p>Each aircraft has a bespoke maneuver deck and flight trait. Aircraft are historic names; the game systems and values here are original.</p></div><div class="choices">${(['player','enemy'] as Side[]).map(side => `<div class="choice-column"><h3>${side === 'player' ? 'Blue pilot' : 'Amber pilot'}</h3><div class="fighter-grid">${aircraft.map(c => fighterCard(c, side)).join('')}</div></div>`).join('')}</div></div>`; document.querySelectorAll<HTMLButtonElement>('[data-fighter]').forEach(btn => btn.addEventListener('click', () => { const side = btn.dataset.side as Side; const current = planeFor(side); const fresh = makePlane(side, craftById(btn.dataset.fighter!)); if (side === 'player') player = fresh; else enemy = fresh; current; render() })); return }
  if (phase === 'gameover') { planning.innerHTML = `<div class="result-card"><p class="kicker">Final report</p><h2>${player.hp > 0 ? 'Blue pilot controls the sky.' : 'Amber pilot controls the sky.'}</h2><p>${message}</p><button id="new-game">Set up another flight</button></div>`; document.querySelector<HTMLButtonElement>('#new-game')?.addEventListener('click', reset); return }
  planning.innerHTML = `<div class="planning-head"><div><p class="kicker">Simultaneous planning</p><h2>Lock one maneuver per pilot</h2></div><p>Cards are revealed together. ${player.locked && enemy.locked ? 'Both plans are locked — resolve when ready.' : 'Pass the screen between pilots.'}</p></div><div class="deck-columns">${deckFor(player)}${deckFor(enemy)}</div>`
  document.querySelectorAll<HTMLButtonElement>('[data-maneuver]').forEach(btn => btn.addEventListener('click', () => { const p = planeFor(btn.dataset.side as Side); if (phase !== 'planning' || p.locked) return; p.selected = btn.dataset.maneuver as ManeuverId; render() }))
  document.querySelectorAll<HTMLButtonElement>('[data-lock]').forEach(btn => btn.addEventListener('click', () => { const p = planeFor(btn.dataset.lock as Side); if (p.selected && !p.locked) { p.locked = p.selected; message = `${p.side === 'player' ? 'Blue' : 'Amber'} pilot has locked a maneuver.`; render() } }))
}

function fighterCard(c: Aircraft, side: Side) { const chosen = planeFor(side).aircraft.id === c.id; return `<button class="fighter ${chosen ? 'chosen' : ''}" data-side="${side}" data-fighter="${c.id}"><span class="fighter-swatch" style="background:${c.color}"></span><b>${c.name.replace('Supermarine ', '').replace('P-51 ', '').replace('Ki-84 ', '')}</b><small>${c.role}</small><em>HP ${c.hp} · GUN ${c.gunnery}</em></button>` }
function deckFor(plane: Plane) { const locked = Boolean(plane.locked); return `<div class="deck-column ${plane.side}"><div class="deck-title"><span>${plane.side === 'player' ? 'Blue pilot deck' : 'Amber pilot deck'}</span><b>${locked ? 'LOCKED' : 'SELECT'}</b></div><div class="maneuver-grid">${plane.aircraft.deck.map(id => { const m = maneuvers[id]; const active = plane.selected === id; const chosen = plane.locked === id; return `<button ${locked ? 'disabled' : ''} class="maneuver ${active ? 'active' : ''} ${chosen ? 'locked' : ''}" data-side="${plane.side}" data-maneuver="${id}"><strong>${m.short}</strong><span>${m.name}</span><em>${m.move} · ${m.turn ? `${m.turn > 0 ? '+' : ''}${m.turn}°` : '—'} · ${m.climb ? `${m.climb > 0 ? '+' : ''}${m.climb}m` : 'level'}</em></button>` }).join('')}</div><button class="lock-button" ${!plane.selected || locked ? 'disabled' : ''} data-lock="${plane.side}">${locked ? `Locked: ${maneuvers[plane.locked!].name}` : 'Lock maneuver'}</button></div>` }

function renderBoard() {
  const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y)
  const vertical = Math.abs(player.altitude - enemy.altitude)
  rangeReadout.textContent = `RANGE ${Math.round(distance)} · ΔALT ${vertical}m`
  const planeSvg = (p: Plane) => `<g transform="translate(${p.x},${p.y}) rotate(${p.heading})" class="token"><circle r="25" fill="${p.aircraft.color}" fill-opacity=".12"/><path d="M-26 -7 L-7 -7 L8 -3 L28 -3 L15 4 L-7 10 L-20 6 Z" fill="${p.aircraft.color}" stroke="#071322" stroke-width="3"/><path d="M-8 -10 L-2 -18 L5 -10" fill="none" stroke="#071322" stroke-width="2"/><circle cx="11" cy="-2" r="3" fill="#071322"/><path d="M28 -3 L45 -3" stroke="${p.aircraft.color}" stroke-width="2" stroke-dasharray="4 4" opacity=".55"/></g><text x="${p.x}" y="${p.y + 44}" text-anchor="middle" class="plane-tag">${p.side === 'player' ? 'BLUE' : 'AMBER'} · ${p.altitude}m</text>`
  board.innerHTML = `<svg viewBox="0 0 ${boardSize.width} ${boardSize.height}" role="img" aria-label="Tactical dogfight board"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#24496e"/><stop offset="1" stop-color="#0b1b32"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="8"/></filter></defs><rect width="940" height="570" fill="url(#sky)"/><g opacity=".14" stroke="#a8d8f0">${Array.from({length: 12}, (_,i)=>`<path d="M${i*85} 0 V570 M0 ${i*55} H940"/>`).join('')}</g><g fill="#eaf7ff" opacity=".12" filter="url(#blur)"><ellipse cx="150" cy="100" rx="82" ry="25"/><ellipse cx="650" cy="125" rx="100" ry="27"/><ellipse cx="480" cy="430" rx="90" ry="22"/></g><circle cx="470" cy="285" r="210" fill="none" stroke="#7ab4d6" stroke-opacity=".18" stroke-dasharray="7 10"/><circle cx="470" cy="285" r="115" fill="none" stroke="#7ab4d6" stroke-opacity=".18" stroke-dasharray="7 10"/>${planeSvg(player)}${planeSvg(enemy)}</svg>`
}
function renderLog() { turnBadge.textContent = phase === 'setup' ? 'SETUP' : phase === 'gameover' ? 'FINAL' : `TURN ${turn}`; logList.innerHTML = log.length ? log.slice(-7).reverse().map(item => `<li>${item}</li>`).join('') : '<li>Radio is quiet. Select aircraft and start the dogfight.</li>' }

function startGame() { phase = 'planning'; turn = 1; damageDeck = shuffle(damages); log = [`Flight launched: ${player.aircraft.name} versus ${enemy.aircraft.name}.`]; message = 'Both pilots choose a maneuver in secret.'; render() }
function move(plane: Plane, card: Maneuver) { let distance = card.move * (1 - sum(plane, 'speed')); let climb = card.climb; if (plane.aircraft.id === 'mustang' && card.id === 'extend') distance += 18; if (plane.aircraft.id === 'hayate' && card.id === 'climb') climb += 16; if (plane.aircraft.id === 'bf109' && card.id === 'immelmann') distance += 22; plane.x = clamp(plane.x + Math.cos(rad(plane.heading)) * distance, 55, boardSize.width - 55); plane.y = clamp(plane.y + Math.sin(rad(plane.heading)) * distance, 55, boardSize.height - 55); plane.heading = norm(plane.heading + card.turn * (1 - sum(plane, 'turn') / 100)); plane.altitude = clamp(Math.round(plane.altitude + climb), 80, 720) }
function drawDamage(target: Plane) { if (!damageDeck.length) damageDeck = shuffle(damages); const dmg = damageDeck.pop()!; target.damages.push({ ...dmg, turn }); target.hp = Math.max(0, target.hp - dmg.hp); log.push(`${target.side === 'player' ? 'Blue' : 'Amber'} takes ${dmg.title} (−${dmg.hp} integrity).`) }
function fire(attacker: Plane, defender: Plane) { const dx = defender.x - attacker.x, dy = defender.y - attacker.y; const range = Math.hypot(dx,dy); const angle = norm(Math.atan2(dy,dx)*180/Math.PI); const arc = angleGap(attacker.heading, angle); const alt = Math.abs(attacker.altitude-defender.altitude); if (range > 305 || arc > 36 || alt > 135) { log.push(`${attacker.side === 'player' ? 'Blue' : 'Amber'} has no firing solution.`); return } const m = maneuvers[attacker.locked!]; let chance = .33 + attacker.aircraft.gunnery * .055 - range / 1400 - sum(attacker,'aim'); if (attacker.aircraft.id === 'spitfire' && (m.id === 'tight-left' || m.id === 'tight-right')) chance += .1; if (Math.random() < clamp(chance, .08, .8)) { log.push(`${attacker.side === 'player' ? 'Blue' : 'Amber'} scores a hit!`); drawDamage(defender) } else log.push(`${attacker.side === 'player' ? 'Blue' : 'Amber'} fires wide.`) }
function resolveTurn() { if (!player.locked || !enemy.locked) return; move(player, maneuvers[player.locked]); move(enemy, maneuvers[enemy.locked]); [player, enemy].forEach(p => { if (p.damages.some(d => d.fire)) { p.hp = Math.max(0, p.hp - 1); log.push(`${p.side === 'player' ? 'Blue' : 'Amber'} loses 1 integrity to fuel fire.`) } }); fire(player, enemy); fire(enemy, player); if (player.hp <= 0 || enemy.hp <= 0) { phase = 'gameover'; message = `${player.hp > 0 ? player.aircraft.name : enemy.aircraft.name} is the last aircraft flying.` } else { phase = 'result'; message = 'Maneuvers resolved. Review the board, then start the next planning phase.' } render() }
function nextTurn() { turn++; player.selected = enemy.selected = undefined; player.locked = enemy.locked = undefined; phase = 'planning'; message = 'Both pilots choose a maneuver in secret.'; render() }
function reset() { phase = 'setup'; turn = 1; log = []; damageDeck = []; player = makePlane('player', player.aircraft); enemy = makePlane('enemy', enemy.aircraft); message = 'Choose a fighter for each pilot, then begin the engagement.'; render() }

render()
