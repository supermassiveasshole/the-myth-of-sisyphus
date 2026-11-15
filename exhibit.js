const chapters = [
  {
    number: '第一章', title: '科林斯之王', image: 'corinth',
    description: '山城科林斯的城墙与多立克式神庙',
    prose: [
      '在海与山之间，西西弗斯建起一座城，名叫埃菲拉，即后来的科林斯。他的父亲是埃俄罗斯，而他自己，则成了希腊传说里以机智闻名的国王。',
      '河神阿索波斯寻找失踪的女儿埃癸娜时，西西弗斯向他透露了带走她的宙斯的踪迹。一位凡人揭开了神的秘密。按《书库》所载，这便是他在冥府推石的缘由。'
    ],
    source: '伪阿波罗多洛斯《书库》卷一 · 1.9.3', url: 'https://www.theoi.com/Text/Apollodorus1.html'
  },
  {
    number: '第二章', title: '被缚的死神', image: 'thanatos',
    description: '西西弗斯将锁链扣在死神塔纳托斯的手腕上',
    prose: [
      '在费雷居德斯讲述的故事里，宙斯派塔纳托斯前去捉拿西西弗斯。国王先一步看破来意，把死神锁了起来。只要锁链还在，人间就没有人死去。直到战神阿瑞斯出手，死亡才重新降临。',
      '西西弗斯还留了一计。他事先嘱咐妻子不要为自己举行祭礼，又借此说服冥王放他回家。重见阳光的国王迟迟没有回来，直到年老，才再度踏入冥府。'
    ],
    source: '费雷居德斯残篇 119 · 古注传本与译文', url: 'https://oaj.fupress.net/index.php/prometheus/article/download/876/876/866'
  },
  {
    number: '第三章', title: '永恒的巨石', image: 'boulder',
    description: '山脊上即将滚下的巨石与远处谷地',
    prose: [
      '奥德修斯在冥府看见了西西弗斯。国王的双手撑着一块巨石，双脚一步一步抵住坡地，几乎把石头送过山脊。就在这时，它猛然掉头，沿着原路滚回平地。',
      '汗水从身上淌下，尘土在头顶扬起。他回到石头跟前，再度弯下腰。《奥德赛》把这一幕留在推石者仍在用力的瞬间。'
    ],
    source: '荷马《奥德赛》卷十一 · 第 593–600 行', url: 'https://www.poetryintranslation.com/PITBR/Greek/Odyssey11.php'
  }
];

const plates = [
  { image: 'ascent', title: '西西弗斯推石', caption: '以阿提卡黑绘陶器为灵感的当代插画。弯曲的脊背与上扬的山坡，围绕着巨石形成一道紧绷的对角线。' },
  ...chapters.map(chapter => ({ image: chapter.image, title: chapter.title, caption: chapter.description + '。当代神话叙事插画。' })),
  { image: 'amphora', title: '黑绘双耳瓶', caption: '当代风格复原图。黑釉瓶颈、双耳与足部，衬出陶土色画带里的推石者。' },
  { image: 'descent', title: '下山的人', caption: '石头已经在谷底，空手下山的人仍有一段独处的路。当代哲学终章插画。' }
];

const select = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const reader = select('#reader');
const lightbox = select('#lightbox');
const menuButton = select('.menu-toggle');
const navigation = select('#navigation');
const audio = select('#guide-audio');
const audioPanel = select('#audio-panel');
const audioLaunch = select('.audio-launch');
let chapterIndex = 0;
let plateIndex = 0;

function setIcon(button, name) {
  button.querySelector('use').setAttribute('href', '#i-' + name);
}

function updateMenu(open) {
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '收起导航' : '打开导航');
  setIcon(menuButton, open ? 'close' : 'menu');
}
menuButton.addEventListener('click', () => updateMenu(!navigation.classList.contains('open')));
navigation.addEventListener('click', () => updateMenu(false));
document.addEventListener('click', event => {
  if (!navigation.contains(event.target) && !menuButton.contains(event.target)) updateMenu(false);
});

const navLinks = all('.main-nav a');
const sections = navLinks.map(link => select(link.hash));
let navQueued = false;
function updateNavigation() {
  const readingLine = window.innerHeight * 0.34;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= readingLine) current = section;
  }
  if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3) {
    current = sections[sections.length - 1];
  }
  for (const link of navLinks) {
    const active = link.hash === '#' + current.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  navQueued = false;
}
function queueNavigation() {
  if (!navQueued) {
    navQueued = true;
    requestAnimationFrame(updateNavigation);
  }
}
window.addEventListener('scroll', queueNavigation, { passive: true });
window.addEventListener('resize', queueNavigation);
updateNavigation();

function showChapter(index) {
  chapterIndex = index;
  const chapter = chapters[index];
  select('#reader-title').textContent = chapter.title;
  select('#reader-number').textContent = chapter.number;
  select('.reader-image').src = 'assets/' + chapter.image + '.webp';
  select('.reader-image').alt = chapter.description;
  select('#reader-prose').replaceChildren(...chapter.prose.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  }));
  select('#source-title').textContent = chapter.source;
  select('#source-link').href = chapter.url;
  select('#reader-count').textContent = '0' + (index + 1) + ' / 03';
  select('#prev-chapter').disabled = index === 0;
  select('#next-chapter span').textContent = index === chapters.length - 1 ? '走进加缪的终章' : '下一章';
  if (!reader.open) reader.showModal();
  reader.scrollTop = 0;
  select('#reader-title').focus({ preventScroll: true });
}
for (const button of all('[data-chapter]')) {
  button.addEventListener('click', () => showChapter(Number(button.dataset.chapter)));
}
select('#prev-chapter').addEventListener('click', () => showChapter(chapterIndex - 1));
select('#next-chapter').addEventListener('click', () => {
  if (chapterIndex < chapters.length - 1) return showChapter(chapterIndex + 1);
  reader.close();
  location.hash = 'philosophy';
  select('#philosophy-heading').focus({ preventScroll: true });
});

function showPlate(index) {
  plateIndex = (index + plates.length) % plates.length;
  const plate = plates[plateIndex];
  select('#large-plate').src = 'assets/' + plate.image + '.webp';
  select('#large-plate').alt = plate.title + '。' + plate.caption;
  select('#plate-title').textContent = plate.title;
  select('#plate-caption').textContent = plate.caption;
  select('#plate-fig').textContent = 'FIG. 0' + (plateIndex + 1) + ' / 0' + plates.length;
  if (!lightbox.open) lightbox.showModal();
}
for (const button of all('[data-plate]')) {
  button.addEventListener('click', () => showPlate(plates.findIndex(plate => plate.image === button.dataset.plate)));
}
select('#prev-plate').addEventListener('click', () => showPlate(plateIndex - 1));
select('#next-plate').addEventListener('click', () => showPlate(plateIndex + 1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') showPlate(plateIndex - 1);
  if (event.key === 'ArrowRight') showPlate(plateIndex + 1);
});
for (const button of all('[data-close]')) {
  button.addEventListener('click', () => button.closest('dialog').close());
}
for (const dialog of [reader, lightbox]) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}

const audioToggle = select('#audio-toggle');
const audioSeek = select('#audio-seek');
const audioStatus = select('.audio-status');
function reflectAudio() {
  setIcon(audioToggle, audio.paused ? 'play' : 'pause');
  audioToggle.setAttribute('aria-label', audio.paused ? '播放导览' : '暂停导览');
  const time = Math.floor(audio.currentTime || 0);
  select('#audio-time').textContent = Math.floor(time / 60) + ':' + String(time % 60).padStart(2, '0');
  if (Number.isFinite(audio.duration)) audioSeek.value = String(audio.currentTime / audio.duration * 100);
}
async function playGuide() {
  audioStatus.textContent = '';
  try {
    await audio.play();
  } catch (error) {
    if (error.name !== 'AbortError') audioStatus.textContent = '音频暂未播放，可再次点击播放或展开导览文字。';
  }
}
function closeAudio() {
  audio.pause();
  audioPanel.hidden = true;
  audioLaunch.setAttribute('aria-expanded', 'false');
}
audioLaunch.addEventListener('click', () => {
  updateMenu(false);
  if (!audioPanel.hidden) return closeAudio();
  audioPanel.hidden = false;
  audioLaunch.setAttribute('aria-expanded', 'true');
  playGuide();
});
select('#audio-close').addEventListener('click', () => {
  closeAudio();
  audioLaunch.focus();
});
audioToggle.addEventListener('click', () => audio.paused ? playGuide() : audio.pause());
audioSeek.addEventListener('input', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(audioSeek.value) / 100 * audio.duration;
});
for (const event of ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata']) audio.addEventListener(event, reflectAudio);
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || reader.open || lightbox.open) return;
  if (!audioPanel.hidden) {
    closeAudio();
    audioLaunch.focus();
  } else if (navigation.classList.contains('open')) {
    updateMenu(false);
    menuButton.focus();
  }
});
