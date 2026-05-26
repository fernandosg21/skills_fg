---
name: create-scroll-video-hero
description: Build or adapt a landing-page hero where a muted video is scrubbed by page scroll, based on the Memora index.php pattern. Use when Codex needs to create an efeito de scroll com video, scroll-controlled video hero, sticky hero video, scroll video scrubbing, video tied to page progress, or replicate the Memora landing hero in PHP, HTML, React, Next.js, Laravel, or static sites.
---

# Create Scroll Video Hero

## Goal

Replicate the Memora landing pattern: a tall hero section, a sticky viewport panel, a muted inline video whose `currentTime` follows scroll progress, and optional text reveal driven by CSS. Prefer adapting the included assets before hand-writing the effect again.

## Workflow

1. Locate the target app's route, global CSS, script pipeline, and media asset folder. Reuse its layout, tokens, buttons, typography, and breakpoint conventions.
2. Add or adapt the markup from `assets/scroll-video-hero.html`. Keep a root with `data-scroll-video-hero`, a video with `data-scroll-video`, and a content block with `data-scroll-video-content`.
3. Add or merge `assets/scroll-video-hero.css`. Preserve the core contract: a tall section, sticky inner viewport, `--scroll-video-progress`, and video transforms tied to that CSS variable.
4. Add or adapt `assets/scroll-video-hero.js`. It maps scroll progress to `video.currentTime`, waits for duration metadata, throttles work with `requestAnimationFrame`, and keeps a reduced-motion fallback.
5. Use a local MP4 whenever possible. Prefer H.264 MP4, muted/no audio, short duration, web-optimized size, and enough keyframes for smooth seeking.
6. Initialize after the DOM is ready. In React/Next, convert the JS into a client component or effect and clean up window listeners on unmount.
7. Verify desktop and mobile scrolling visually. Confirm the video frame changes while scrolling, the next section is reachable without an awkward dead zone, and the console has no media/seek errors.

## Implementation Notes

- Keep `muted`, `playsinline`, `preload="auto"`, `disablepictureinpicture`, and `controlslist` on the video.
- Do not autoplay as the primary effect. The intended behavior is scrubbed playback controlled by scroll.
- Tune the section height before changing JS. Memora uses roughly `145vh` desktop and `165vh` mobile; shorter values feel snappier, taller values make the video scrub more slowly.
- Keep the decoder unlock handlers (`wheel`, `touchstart`, `pointerdown`) for mobile/Safari reliability.
- The blob preload is optional but useful when direct seeking stutters. Keep the direct source fallback if fetch/blob fails.
- For `prefers-reduced-motion: reduce`, show the first frame and visible content without scroll-driven movement.
- If the hero appears blank, first check that the MP4 URL loads, metadata fires, and the section has a nonzero `height`.

## Assets

- `assets/scroll-video-hero.html`: neutral HTML/PHP-friendly markup.
- `assets/scroll-video-hero.css`: portable CSS based on the Memora visual structure.
- `assets/scroll-video-hero.js`: portable JavaScript engine for one or more heroes on the page.

Use the assets as a starting point, then rename classes/selectors only after the effect works.
