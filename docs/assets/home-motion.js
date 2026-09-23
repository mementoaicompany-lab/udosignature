/* Official YouTube embed and local decorative motion only. No analytics writes. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sceneButton = document.querySelector('[data-scenes-toggle]');
  const scenes = [...document.querySelectorAll('[data-motion-scene]')];
  let scenesPaused = false;
  function updateScenes() {
    document.body.classList.toggle('scenes-paused', scenesPaused || reduced.matches || document.hidden);
    sceneButton.hidden = reduced.matches;
    sceneButton.textContent = scenesPaused ? '움직임 재생 ▷' : '움직임 멈추기 Ⅱ';
    sceneButton.setAttribute('aria-pressed', String(scenesPaused));
  }
  sceneButton.addEventListener('click', () => { scenesPaused = !scenesPaused; updateScenes(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.dataset.visible = String(entry.isIntersecting);
    }), { threshold: .08 });
    scenes.forEach(scene => observer.observe(scene));
  } else scenes.forEach(scene => { scene.dataset.visible = 'true'; });
  reduced.addEventListener('change', updateScenes);
  document.addEventListener('visibilitychange', updateScenes);
  updateScenes();

  const stage = document.querySelector('[data-signature-film]');
  const button = stage.querySelector('[data-film-toggle]');
  const status = stage.querySelector('[data-film-status]');
  let player, ready = false, loading = false, failed = false, timer;
  let requested = !(reduced.matches || navigator.connection?.saveData);
  let visible = true, playing = false;
  button.hidden = false;
  function paint() {
    button.textContent = playing ? '영상 멈추기 Ⅱ' : '영상 재생 ▷';
    button.setAttribute('aria-pressed', String(playing));
  }
  function fallback(message) {
    playing = false;
    status.textContent = message;
    paint();
  }
  function sync() {
    if (!ready || failed) return;
    if (requested && visible && !document.hidden) player.playVideo();
    else player.pauseVideo();
  }
  function load() {
    if (loading || failed) return;
    loading = true;
    status.textContent = '우도의 바다를 불러오는 중이에요.';
    timer = setTimeout(() => {
      if (!playing) fallback('영상 재생을 눌러보세요. 전체 영상은 YouTube에서도 볼 수 있어요.');
    }, 14000);
    function createPlayer() {
      player = new YT.Player('signature-film-player', {
        host: 'https://www.youtube-nocookie.com',
        videoId: 'tGDVOPpq6bg',
        playerVars: { autoplay: 0, mute: 1, controls: 0, playsinline: 1, loop: 1,
          playlist: 'tGDVOPpq6bg', rel: 0, disablekb: 1, origin: location.origin },
        events: {
          onReady(event) {
            ready = true;
            const iframe = event.target.getIframe();
            iframe.title = '광샤필름의 제주도 우도 드론영상 (음소거)';
            iframe.tabIndex = -1;
            iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            event.target.mute();
            sync();
          },
          onStateChange(event) {
            playing = event.data === YT.PlayerState.PLAYING;
            if (playing) {
              clearTimeout(timer);
              stage.classList.add('film-visible');
              status.textContent = '';
            }
            paint();
          },
          onAutoplayBlocked() {
            requested = false;
            fallback('소리 없이 재생돼요. 영상 재생 버튼을 눌러주세요.');
          },
          onError() {
            failed = true;
            clearTimeout(timer);
            stage.classList.remove('film-visible');
            button.hidden = true;
            fallback('지금은 영상 연결이 어려워요. ‘영상 전체 보기’로 만나보세요.');
          }
        }
      });
    }
    if (window.YT?.Player) createPlayer();
    else {
      window.onYouTubeIframeAPIReady = createPlayer;
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => { failed = true; clearTimeout(timer); button.hidden = true; fallback('영상은 ‘영상 전체 보기’에서 만나보세요.'); };
      document.head.append(script);
    }
  }
  button.addEventListener('click', () => {
    requested = !playing;
    if (!loading) load(); else sync();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: .1 }).observe(stage);
  }
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => {
    if (reduced.matches) { requested = false; sync(); }
  });
  paint();
  if (requested) load();
})();
