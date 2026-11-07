(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  if (reduceMotion.matches || !Element.prototype.animate || navigation?.type === 'back_forward') return;

  const sprite = 'assets/images/about-ostrich-egg.png';
  const artwork = `<image href="${sprite}" width="2888" height="1502"/>`;
  const closedEgg = `<svg class="page-arrival-closed" viewBox="2020 424 868 1078">${artwork}</svg>`;
  const hatch = `
    <svg class="page-arrival-bird" viewBox="286 312 858 1190">
      <defs><clipPath id="arrival-bird-clip"><path d="M448 312H1144V1502H286V612H448Z"/></clipPath></defs>
      <g clip-path="url(#arrival-bird-clip)">${artwork}</g>
    </svg>
    <svg class="page-arrival-cap" viewBox="0 0 880 596">
      <defs><clipPath id="arrival-cap-clip"><path d="M0 0H880V312H448V596H0Z"/></clipPath></defs>
      <g clip-path="url(#arrival-cap-clip)">${artwork}</g>
    </svg>`;
  const title = 'Alicia Xuanyi Yu'.split(' ').map(word => `<span>${[...word].map(letter =>
    `<span class="page-arrival-letter"><span>${letter}</span></span>`
  ).join('')}</span>`).join('');
  const formation = [-2, -1, 0, 1, 2].map(slot => `
    <div class="page-arrival-egg" data-slot="${slot}" style="transform:translate3d(${slot * 17}cqi,0,0)">
      ${closedEgg}${slot === 0 ? hatch : ''}
    </div>`).join('');

  const root = document.documentElement;
  const curtain = document.createElement('div');
  curtain.className = 'page-arrival';
  curtain.setAttribute('aria-hidden', 'true');
  curtain.innerHTML = `
    <div class="page-arrival-scene">
      <div class="page-arrival-name">${title}</div>
      <div class="page-arrival-formation">${formation}</div>
    </div>`;
  document.body.prepend(curtain);
  root.classList.add('page-arrival-active');

  const animations = [];
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    animations.forEach(animation => animation.cancel());
    curtain.remove();
    root.classList.remove('page-arrival-active');
    window.removeEventListener('keydown', skip);
    window.removeEventListener('pagehide', finish);
    window.removeEventListener('beforeprint', finish);
    reduceMotion.removeEventListener('change', finish);
  };
  const skip = event => {
    if (event.key === 'Escape' || event.key === 'Tab') finish();
  };
  let watchdog = setTimeout(finish, 1400);
  window.addEventListener('keydown', skip);
  window.addEventListener('pagehide', finish);
  window.addEventListener('beforeprint', finish);
  reduceMotion.addEventListener('change', finish);

  function animate(element, frames, duration, delay, easing = 'linear') {
    const animation = element.animate(frames, { duration, delay, easing, fill: 'both' });
    animations.push(animation);
    return animation;
  }

  function play() {
    if (finished) return;
    clearTimeout(watchdog);
    const eggs = [...curtain.querySelectorAll('.page-arrival-egg')];
    const center = eggs[2];
    const spreadDelay = 160;
    const spreadDuration = 500;
    const hatchAt = 950;
    const hatchDuration = 395;
    const letters = [...curtain.querySelectorAll('.page-arrival-letter > span')];
    const letterDuration = 390;
    const letterStagger = 28;
    const moveOut = 'cubic-bezier(.22,.68,.22,1)';

    eggs.forEach(egg => {
      const slot = Number(egg.dataset.slot);
      const distance = Math.abs(slot);
      if (!distance) return;
      const x = Math.sign(slot) * (distance === 1 ? 26 : 48);
      const y = distance === 1 ? -6 : -11;
      const z = distance === 1 ? -24 : -48;
      animate(egg, [
        { transform: `translate3d(${slot * 17}cqi,0,0) scale(1)`, opacity: 1 },
        { transform: `translate3d(${x}cqi,${y}cqi,${z}cqi) scale(${distance === 1 ? .98 : .88})`,
          opacity: distance === 1 ? .72 : .47 }
      ], spreadDuration, spreadDelay, moveOut);
    });
    animate(center, [
      { transform: 'translate3d(0,0,0) scale(1)', easing: 'cubic-bezier(.2,.75,.27,1)' },
      { transform: 'translate3d(0,3.8cqi,8cqi) scale(1.86)', offset: .65 },
      { transform: 'translate3d(0,2.8cqi,6cqi) scale(1.73)', offset: .85 },
      { transform: 'translate3d(0,3cqi,6cqi) scale(1.77)' }
    ], spreadDuration, spreadDelay);

    const shell = center.querySelector('.page-arrival-closed');
    animate(shell, [
      { transform: 'rotate(0deg)', opacity: 1 },
      { transform: 'rotate(-9deg)', offset: .23 },
      { transform: 'rotate(8deg)', offset: .47 },
      { transform: 'rotate(-5deg)', offset: .68 },
      { transform: 'rotate(0deg) scale(1.04,.94)', opacity: 1, offset: .9 },
      { transform: 'rotate(0deg) scale(1.04,.94)', opacity: 0 }
    ], hatchAt - spreadDelay - spreadDuration, spreadDelay + spreadDuration);
    animate(center.querySelector('.page-arrival-bird'), [
      { transform: 'translateY(9%) scale(.84)', opacity: 0 },
      { transform: 'translateY(-10%) scale(1.04)', opacity: 1, offset: .55 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], hatchDuration, hatchAt, moveOut);
    animate(center.querySelector('.page-arrival-cap'), [
      { transform: 'translate(0,14%) rotate(0deg) scale(.7)', opacity: 0 },
      { opacity: 1, offset: .28 },
      { transform: 'translate(-48%,-24%) rotate(-26deg) scale(.88)', opacity: 1 }
    ], hatchDuration, hatchAt, moveOut);
    letters.forEach((letter, index) => {
      animate(letter, [
        { transform: 'translateY(110%)', easing: 'cubic-bezier(.24,.76,.28,1)' },
        { transform: 'translateY(-7%)', offset: .79 },
        { transform: 'translateY(0)' }
      ], letterDuration, hatchAt + index * letterStagger);
    });

    const lastLetter = hatchAt + letterDuration + (letters.length - 1) * letterStagger;
    const fadeAt = lastLetter + 500;
    const fadeDuration = 220;
    watchdog = setTimeout(finish, fadeAt + fadeDuration + 400);
    animate(curtain, [{ opacity: 1 }, { opacity: 0 }], fadeDuration, fadeAt, 'ease-in-out')
      .finished.then(finish, finish);
  }

  const image = new Image();
  image.src = sprite;
  image.decode().then(play, finish).catch(finish);
})();
