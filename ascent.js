// Coordinates follow the painted ridge in a 1000 × 400 composition.
(() => {
  const stage = document.querySelector('.hero-stage');
  const canvas = document.querySelector('#ascent-scene');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const ridge = [
    [360, 394], [400, 390], [450, 382], [500, 368], [550, 353],
    [600, 338], [650, 321], [700, 302], [750, 280], [800, 258],
    [850, 236], [900, 215], [950, 196], [990, 184], [1000, 183]
  ];
  const ease = t => t * t * (3 - 2 * t);
  const clamp = value => Math.max(0, Math.min(1, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  function ground(x) {
    let i = 1;
    while (i < ridge.length - 1 && ridge[i][0] < x) i++;
    const [x0, y0] = ridge[i - 1];
    const [x1, y1] = ridge[i];
    return lerp(y0, y1, clamp((x - x0) / (x1 - x0)));
  }
  const gradient = x => (ground(x + 10) - ground(x - 10)) / 20;

  const lower = 665, upper = 884, radius = 97;
  const crest = 9.0, release = 9.65, land = 11.65, returnEnd = 16.65, duration = 17.3;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controls = document.querySelector('.scene-controls');
  const toggle = document.querySelector('#motion-toggle');
  const seek = document.querySelector('#scene-seek');
  const label = document.querySelector('#motion-phase');
  let paused = media.matches;
  let elapsed = 5.7;
  let frame = 0;
  let previousTime = 0;
  let visible = false;
  let ready = false;
  let art;
  let lastPaint = 0;

  function pushPose(stoneX) {
    // Lock the back sole to the ridge and both hands to the left face of the stone.
    const h = 186, w = h * 422 / 384;
    let footX = stoneX - radius - w * .84;
    const angle = Math.atan2(ground(footX + 85) - ground(footX), 85) + .20;
    const dx = w * (.92 - .075), dy = h * (.135 - .984);
    const handDX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const handDY = dx * Math.sin(angle) + dy * Math.cos(angle);
    const centerY = stoneHeight(stoneX);
    for (let i = 0; i < 3; i++) {
      const distanceY = (ground(footX) + handDY - centerY) / radius;
      const edge = radius * Math.sqrt(Math.max(.2, 1 - distanceY * distanceY));
      footX = stoneX - edge - handDX + 2.5;
    }
    return { x: footX, y: ground(footX), angle, w, h };
  }
  function stoneHeight(x) {
    return ground(x) - radius * Math.hypot(1, gradient(x)) + 1.5;
  }
  function figure(sheet, step, x, y, w, h, pinX, pinY, angle, opacity) {
    if (opacity <= 0) return;
    const cell = sheet.width / 8;
    context.save();
    context.globalAlpha = opacity;
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(sheet, (Math.floor(step) % 8) * cell, 0, cell, sheet.height,
      -pinX * w, -pinY * h, w, h);
    context.restore();
  }
  const crestWalkerX = pushPose(upper).x + 146;
  const footWalkerX = pushPose(lower).x + 17;
  function drawStone(x, fallBounce) {
    // Convert distance along the slope to rotation, so the etched markings roll with the rock.
    const angle = (x - lower) * 1.073 / radius;
    context.save();
    context.translate(x, stoneHeight(x) - fallBounce);
    context.rotate(angle);
    context.drawImage(art.stone, -radius, -radius, radius * 2, radius * 2);
    context.restore();
  }

  function paint() {
    if (!ready) return;
    const t = elapsed % duration;
    const ascent = clamp(t / crest);
    const progress = ease(ascent) * .65 + ascent * .35;
    const fall = clamp((t - release) / (land - release));
    const descent = ease(clamp((t - land) / (returnEnd - land)));
    let rockX = lerp(lower, upper, progress);
    if (t >= release) rockX = lerp(upper, lower, fall * fall);
    const settle = Math.max(0, t - land);
    const impact = t >= land && settle < .42 ? 3.5 * Math.abs(Math.sin(settle * 16)) * Math.exp(-settle * 8) : 0;
    const pose = pushPose(t < release ? rockX : t < land ? upper : lerp(upper, lower, descent));
    const stand = ease(clamp((t - (release - .17)) / .56)) * (1 - ease(clamp((t - returnEnd) / (duration - returnEnd))));
    // He turns where his torso was, then approaches the stone from the downhill side.
    const walkX = lerp(crestWalkerX, footWalkerX, descent);
    const walkY = ground(walkX);
    const phase = t < crest ? '上推' : t < release ? '将至' : t < land ? '滚落' : '下山';

    const { width, height } = canvas;
    const narrow = stage.clientWidth <= 565 && window.matchMedia('(max-width: 600px)').matches;
    const viewWidth = narrow ? 650 : 1000;
    context.setTransform(width / viewWidth, 0, 0, height / 400, -(1000 - viewWidth) * width / viewWidth, 0);
    context.drawImage(art.slope, 0, 0, 1000, 400);

    const returnSteps = descent * (upper - lower) / 30;
    drawStone(rockX, impact);
    figure(art.walker, returnSteps * 8, walkX, walkY - 2, 227 * 276 / 384, 227,
      .13, .986, Math.atan(gradient(walkX + 45)) * .70, stand);
    const pushSteps = (Math.min(t, crest) / 1.32) * 8;
    figure(art.pusher, t < release ? pushSteps : 0, pose.x, pose.y, pose.w, pose.h,
      .075, .984, pose.angle, 1 - stand);

    const position = Math.round(t / duration * 1000);
    seek.value = String(position);
    seek.style.setProperty('--position', position / 10 + '%');
    if (label.textContent !== phase) label.textContent = phase;
    const valueText = phase + '，' + Math.floor(t) + ' 秒';
    if (seek.getAttribute('aria-valuetext') !== valueText) seek.setAttribute('aria-valuetext', valueText);
  }

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(stage.clientWidth * scale));
    const h = Math.max(1, Math.round(stage.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    paint();
  }
  function tick(time) {
    if (previousTime) elapsed = (elapsed + (time - previousTime) / 1000) % duration;
    previousTime = time;
    if (time - lastPaint >= 1000 / 30) {
      paint();
      lastPaint = time;
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    toggle.setAttribute('aria-label', paused ? '播放推石动画' : '暂停推石动画');
    toggle.title = paused ? '播放动画' : '暂停动画';
    toggle.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
    const running = ready && visible && !paused && !document.hidden;
    if (running && !frame) frame = requestAnimationFrame(tick);
    if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
  }
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  seek.addEventListener('input', () => {
    paused = true;
    elapsed = Math.min(duration - .001, Number(seek.value) / 1000 * duration);
    sync();
    paint();
  });
  media.addEventListener('change', () => { paused = media.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  const inView = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  inView.observe(stage);
  new ResizeObserver(resize).observe(stage);

  async function load(name) {
    const image = new Image();
    image.src = 'assets/' + name + '.webp';
    await image.decode();
    return image;
  }
  Promise.all(['slope', 'stone', 'pusher-gait', 'walker-gait'].map(load)).then(([slope, stone, pusher, walker]) => {
    art = { slope, stone, pusher, walker };
    ready = true;
    resize();
    stage.classList.add('ready');
    controls.hidden = false;
    sync();
  }).catch(() => { /* The original painted plate stays visible if an image cannot load. */ });
})();
