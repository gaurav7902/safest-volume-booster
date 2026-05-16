;(() => {
    if (window.__volumeBoosterContentLoaded) {
        return
    }

    window.__volumeBoosterContentLoaded = true

    const DEFAULT_STATE = {
        enabled: true,
        boost: 100,
    }

    const booster = {
        state: { ...DEFAULT_STATE },
        audioContext: null,
        mediaNodes: new WeakMap(),
        observer: null,
        retryTimer: null,
    }

    init()

    function init() {
        getStorage(DEFAULT_STATE).then((saved) => {
            booster.state = normalizeState(saved)
            startWatching()
            applyBoostToPage()
        })

        chrome.runtime.onMessage.addListener(
            (message, _sender, sendResponse) => {
                if (message?.type !== 'VOLUME_BOOSTER_SET') {
                    return false
                }

                booster.state = normalizeState(message.state)
                const result = applyBoostToPage()

                sendResponse({
                    ok: result.boosted > 0,
                    message: getStatusMessage(result),
                })

                return false
            },
        )
    }

    function startWatching() {
        if (booster.observer) {
            return
        }

        booster.observer = new MutationObserver(scheduleApply)
        booster.observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        })

        document.addEventListener('play', scheduleApply, true)
        document.addEventListener('loadedmetadata', scheduleApply, true)
        window.addEventListener('yt-navigate-finish', scheduleApply)
    }

    function scheduleApply() {
        clearTimeout(booster.retryTimer)
        booster.retryTimer = setTimeout(applyBoostToPage, 120)
    }

    function applyBoostToPage() {
        const mediaElements = findMediaElements()
        let boosted = 0

        mediaElements.forEach((media) => {
            if (applyBoostToElement(media)) {
                boosted += 1
            }
        })

        return {
            found: mediaElements.length,
            boosted,
        }
    }

    function findMediaElements() {
        return [
            ...document.querySelectorAll(
                'video.html5-main-video, video, audio',
            ),
        ]
    }

    function applyBoostToElement(media) {
        const multiplier = booster.state.enabled ? booster.state.boost / 100 : 1
        const node = getOrCreateNode(media)

        media.volume = 1

        if (node) {
            node.gain.gain.value = multiplier
            return true
        }

        return false
    }

    function getOrCreateNode(media) {
        const existing = booster.mediaNodes.get(media)
        if (existing) {
            return existing
        }

        try {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext
            if (!AudioContextClass) {
                return null
            }

            if (!booster.audioContext) {
                booster.audioContext = new AudioContextClass()
            }

            if (booster.audioContext.state === 'suspended') {
                booster.audioContext.resume().catch(() => {})
            }

            const source = booster.audioContext.createMediaElementSource(media)
            const gain = booster.audioContext.createGain()

            source.connect(gain)
            gain.connect(booster.audioContext.destination)

            const node = { source, gain }
            booster.mediaNodes.set(media, node)
            return node
        } catch {
            return null
        }
    }

    function getStatusMessage(result) {
        if (result.found === 0) {
            return 'No media found on this page'
        }

        if (result.boosted === 0) {
            return 'Audio hook blocked on this page'
        }

        if (!booster.state.enabled || booster.state.boost <= 100) {
            return 'Boost is off'
        }

        return `Boosting at ${booster.state.boost}%`
    }

    function getStorage(defaults) {
        return new Promise((resolve) => {
            const result = chrome.storage.sync.get(defaults, resolve)
            if (result && typeof result.then === 'function') {
                result.then(resolve)
            }
        })
    }

    function normalizeState(value) {
        return {
            enabled: Boolean(value?.enabled),
            boost: clamp(Number(value?.boost) || DEFAULT_STATE.boost, 100, 600),
        }
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max)
    }
})()
