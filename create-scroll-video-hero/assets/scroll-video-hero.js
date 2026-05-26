(function () {
    function initScrollVideoHero(root) {
        const section = root || document.querySelector('[data-scroll-video-hero]');
        if (!section) return null;

        const video = section.querySelector('[data-scroll-video]');
        const content = section.querySelector('[data-scroll-video-content]');
        if (!video) return null;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const setProgress = (progress) => {
            section.style.setProperty('--scroll-video-progress', progress.toFixed(4));
        };

        const sourceEl = video.querySelector('source');
        const originalSrc = (sourceEl && sourceEl.src) || video.currentSrc || video.src;

        let rafPending = false;
        let hasUnlocked = false;
        let hasLoadedBlob = false;
        let blobUrl = null;
        let mediaDuration = 0;
        let metadataReady = false;

        video.pause();
        video.muted = true;
        video.preload = 'auto';
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        setProgress(0);

        const getProgress = () => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const viewportHeight = window.innerHeight;
            const scrollable = sectionHeight - viewportHeight;

            if (scrollable <= 0) return 0;

            const scrollY = window.scrollY || window.pageYOffset;
            return clamp((scrollY - sectionTop) / scrollable, 0, 1);
        };

        const readDuration = () => {
            const rawDuration = Number(video.duration);
            if (Number.isFinite(rawDuration) && rawDuration > 0) {
                return rawDuration;
            }

            if (video.seekable && video.seekable.length > 0) {
                const seekableEnd = Number(video.seekable.end(video.seekable.length - 1));
                if (Number.isFinite(seekableEnd) && seekableEnd > 0) {
                    return seekableEnd;
                }
            }

            return 0;
        };

        const seekByProgress = (progress) => {
            setProgress(progress);
            if (!metadataReady || mediaDuration <= 0) return;

            const maxSeek = Math.max(0, mediaDuration - 0.001);
            const target = clamp(mediaDuration * progress, 0, maxSeek);

            if (Math.abs(video.currentTime - target) > 0.012) {
                try {
                    video.currentTime = target;
                } catch (error) {
                    // Ignore transient seek errors while the decoder warms up.
                }
            }
        };

        const syncVideo = () => {
            seekByProgress(getProgress());
        };

        const scheduleSync = () => {
            if (rafPending) return;
            rafPending = true;
            window.requestAnimationFrame(() => {
                rafPending = false;
                syncVideo();
            });
        };

        const activateMetadata = () => {
            const duration = readDuration();
            if (duration <= 0) return;

            mediaDuration = duration;
            metadataReady = true;
            syncVideo();
        };

        const unlockDecoder = () => {
            if (hasUnlocked) return;

            hasUnlocked = true;
            video.play().then(() => video.pause()).catch(() => {});
            activateMetadata();
            scheduleSync();
        };

        const attachSource = (src) => {
            if (!src) return;

            if (sourceEl) {
                sourceEl.src = src;
            } else {
                video.src = src;
            }

            video.load();
        };

        const preloadBlobForSeeking = async () => {
            if (hasLoadedBlob || !originalSrc || !window.fetch || !window.URL) return;

            hasLoadedBlob = true;
            try {
                const response = await fetch(originalSrc, { cache: 'force-cache' });
                if (!response.ok) return;

                const blob = await response.blob();
                blobUrl = URL.createObjectURL(blob);
                attachSource(blobUrl);
            } catch (error) {
                // Keep direct source if blob preload fails.
            }
        };

        if (video.readyState === 0) {
            video.load();
        }

        activateMetadata();
        video.addEventListener('loadedmetadata', activateMetadata);
        video.addEventListener('loadeddata', activateMetadata);
        video.addEventListener('canplay', activateMetadata);
        video.addEventListener('durationchange', activateMetadata);

        if (content) {
            requestAnimationFrame(() => content.classList.add('is-visible'));
        }

        if (reducedMotion) {
            try {
                video.currentTime = 0;
            } catch (error) {
                // noop
            }
            setProgress(0);
            return null;
        }

        preloadBlobForSeeking().finally(scheduleSync);

        window.addEventListener('scroll', scheduleSync, { passive: true });
        window.addEventListener('resize', scheduleSync);
        window.addEventListener('orientationchange', scheduleSync);
        window.addEventListener('wheel', unlockDecoder, { once: true, passive: true });
        window.addEventListener('touchstart', unlockDecoder, { once: true, passive: true });
        window.addEventListener('pointerdown', unlockDecoder, { once: true, passive: true });

        const cleanup = () => {
            window.removeEventListener('scroll', scheduleSync);
            window.removeEventListener('resize', scheduleSync);
            window.removeEventListener('orientationchange', scheduleSync);
            window.removeEventListener('wheel', unlockDecoder);
            window.removeEventListener('touchstart', unlockDecoder);
            window.removeEventListener('pointerdown', unlockDecoder);

            video.removeEventListener('loadedmetadata', activateMetadata);
            video.removeEventListener('loadeddata', activateMetadata);
            video.removeEventListener('canplay', activateMetadata);
            video.removeEventListener('durationchange', activateMetadata);

            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };

        window.addEventListener('beforeunload', cleanup, { once: true });
        scheduleSync();

        return cleanup;
    }

    function initAllScrollVideoHeroes() {
        return Array.from(document.querySelectorAll('[data-scroll-video-hero]'), initScrollVideoHero);
    }

    window.initScrollVideoHero = initScrollVideoHero;
    window.initAllScrollVideoHeroes = initAllScrollVideoHeroes;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllScrollVideoHeroes, { once: true });
    } else {
        initAllScrollVideoHeroes();
    }
})();
