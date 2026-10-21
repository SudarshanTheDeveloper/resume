# M G Sudarshan — a playable Unreal Engine C++ portfolio

A third-person browser portfolio with a personalized anime avatar and four project exhibits, alongside a complete recruiter-friendly portfolio. The interactive website is implemented with Three.js; the professional work it describes is based on the supplied C++ / Unreal Engine resume.

## Run locally

With Node.js installed, run:

```sh
npm run dev
```

Open http://127.0.0.1:4173. There is no dependency installation or build step. All fonts and runtime dependencies are bundled locally.

- `/` or `/#world`: the lab entrance, with Explore and Quick portfolio choices.
- `/?view=portfolio#work`: direct access to the quick portfolio.
- `/#journey`: compatible with the earlier preview link; opens the playable lab.

```sh
npm run check
npm test
```

Checks validate local assets, navigation, unique IDs, project content, and the supplied PDF. Navigation tests verify routes to all exhibits, sixteen routes between exhibits, route following, interaction range, collision behavior, and island boundaries.

## Explore the lab

- WASD or arrow keys: camera-relative movement.
- Shift: run. Space: jump.
- E or Enter: open a nearby project.
- Click the ground or an exhibit sign: walk there using obstacle-aware routing.
- Drag the world: orbit the camera. Scroll over the world: zoom.
- M: map. P or Escape: pause/resume.
- Home button: return to the central plaza.
- Touch screens: joystick, Run toggle, Jump button, and drag to orbit.

The map provides direct travel to Capture Studio, Light Pavilion, XR Portal, and Systems Lab. Opening a project pauses exploration, and closing it restores keyboard control. Visited exhibits are remembered locally when browser storage is available. There is no server-side tracking or account requirement.

A lower-quality rendering option reduces pixel density and disables shadows. The controls panel offers reduced camera motion and respects the operating system's motion preference by default. Pausing, hiding the tab, or opening a project suspends gameplay. Browsers without WebGL receive an explanation and direct access to the quick portfolio.

## Apex Circuit racing

Enter **Race Paddock** from the lab map, walk to the chequered gateway at the north end of the island and press E, or use the racing section in the quick portfolio. Returning from the circuit restores the avatar where you left it.

Choose one of three car liveries and start a three-lap arcade race against two AI rivals. The original 687-metre circuit includes asphalt, striped kerbs, gravel shoulders, barriers, a pit lane/building, start lights, grid markings, grandstands and trackside signs. The open-wheel cars, circuit and scenery are procedural Three.js geometry; this is an original browser game, not an official F1 game or a reproduction of a licensed real-world track.

- W / Up: accelerate. S / Down / Space: brake.
- A / D or Left / Right: steer. Slow down before tight corners.
- R or Reset car: recover to the last checkpoint, with a three-second time penalty.
- Escape / P or Pause: pause/resume; lap and opponent timers stop.
- Phone/tablet: hold the steering, GO and BRAKE buttons; simultaneous inputs are supported.

The HUD shows race position, current/last/best lap, speed, an arcade gear indicator, circuit map, off-road and wrong-way warnings. Lap validation requires twelve ordered sectors; reversing or skipping sectors does not award a lap. Grass slows the car and the barriers keep it inside the circuit. Your best lap is stored only in this browser when local storage is available. The chequered-flag screen reports position, total race time, best lap and reset penalties, with replay and return options. There is no online multiplayer or global leaderboard.

Racing uses the lab's existing WebGL renderer and only creates its scene when first entered. The lap/handling test suite includes a complete three-lap simulation through the actual driving inputs, alongside countdown, braking, steering, barriers, penalties and lap validation checks.

## Personal avatar

`js/avatar.js` renders a hand-drawn **2D anime character** inside the 3D campus. The older procedural character mesh has been replaced. The avatar uses twelve illustrated frames: front, left profile (mirrored for the right side), and rear views, with four walking phases per view. The camera-facing sprite chooses its drawing from the avatar's direction relative to the camera. Foot alignment, a grounded contact shadow, and the existing jump controller keep it anchored in the world.

The artwork follows the supplied portrait: swept dark hair, black glasses, forehead marking, subtle facial hair, orange plaid shirt, charcoal trousers, and cream sneakers. A **Your guide** button opens a full-body character preview, and its portrait appears in the exploration controls. Reduced-motion mode freezes the walk-frame animation; movement and jumping remain available.

The transparent atlas is bundled at `assets/media/avatar-anime-v1.png`; its final built-in image-generation prompt is preserved at `design/avatar-anime-v1.prompt.txt`. The original 3D concept image remains in `design/` as an earlier design reference. Atlas cells are aligned into small runtime textures without modifying the source PNG. An illustrated placeholder keeps the game usable if the image cannot load.

## Source map

- `index.html`: both portfolio modes, game interface, project dialogs, resume links, experience, and contact details.
- `css/portfolio.css`: quick portfolio design and responsive typography.
- `css/playable-lab.css`: world interface, entrance, map, help, pause, and touch controls.
- `js/playable-lab.js`: gameplay, camera, input, interactions, minimap, and browser lifecycle.
- `js/lab-world.js`: campus environment, lighting, signs, scenery, and project exhibit placement.
- `js/game-navigation.js`: exhibit positions, collision rules, and click-to-walk pathfinding.
- `js/race-physics.js`: original circuit sampling, arcade handling, checkpoint/lap rules and timing.
- `js/race-world.js`: circuit environment and open-wheel car geometry.
- `js/racing-game.js`: race lifecycle, opponents, chase camera, HUD, input and saved best lap.
- `css/racing.css`: paddock, race interface, touch controls and portfolio racing section.
- `js/avatar.js`: illustrated anime sprites, directional walk cycles, preview rendering and contact shadow.
- `js/journey-worlds.js`: the four conceptual exhibit models.
- `js/portfolio.js`: portfolio mode switching, project filtering, dialogs, media binding, and contact actions.
- `js/projects.js`: case study content and project media configuration.
- `js/render-lab.js`: the interactive sculpture in the quick portfolio's hero.
- `resume.pdf`: the latest resume supplied for this project.

## Add actual project screenshots and videos

Current project visuals are explicitly labeled conceptual illustrations. Project descriptions follow the supplied resume. No performance numbers, testimonials, or outcomes were invented.

Put shareable media in `assets/media/`. In `js/projects.js`, replace a project's `media: null` entry with:

```js
media: {
  type: 'image',
  src: 'assets/media/panorama-capture.webp',
  alt: 'Describe the actual project screenshot',
  caption: 'What this demonstrates and your contribution.'
}
```

Or use a video:

```js
media: {
  type: 'video',
  src: 'assets/media/runtime-demo.mp4',
  poster: 'assets/media/runtime-poster.webp',
  alt: 'Runtime asset integration demonstration',
  caption: 'Describe the workflow in this recording.'
}
```

The same configuration updates the project card and its breakdown. Videos use native playback controls and do not autoplay. Provide captions or a text track for spoken recordings.

Use `npm run illustrations` to regenerate the four conceptual SVG studies and favicon. It does not modify actual project media or the avatar concept.

## Hosting

This is a static website that can be hosted on GitHub Pages or another static host. Relative asset paths support repository subpaths. Nothing is automatically deployed or pushed by this code.

Before publication, set the `og:image` metadata to the absolute deployed URL of `assets/media/social-preview.png`, and add the verified canonical URL. The local preview server supports video/PDF byte ranges and blocks hidden paths such as `.git`.

Earlier web experiments remain in the repository, outside the new portfolio's navigation.

## Licenses

- Three.js 0.180.0: `assets/vendor/THREE-LICENSE.txt`.
- Manrope and Space Grotesk: SIL Open Font License files in `assets/fonts/`.
- The campus, car geometry, and technical illustrations are authored in this project. The anime sprite artwork was made with built-in image generation using the supplied portrait; its final prompt is preserved in `design/`.
