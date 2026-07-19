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
        playingElements: new Set(),
        observer: null,
        retryTimer: null,
    }

    init()

    async function init() {
        try {
            const saved = await getStorage(DEFAULT_STATE)
            booster.state = normalizeState(saved)
            startWatching()
            applyBoostToPage()
        } catch (e) {
            console.error('Volume Booster: Failed to initialize', e)
        }

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

        if (media.volume !== 1) {
            media.volume = 1
        }

        if (node) {
            if (node.gain.gain.value !== multiplier) {
                node.gain.gain.value = multiplier
            }
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

            const source = booster.audioContext.createMediaElementSource(media)
            const gain = booster.audioContext.createGain()

            source.connect(gain)

            const node = { source, gain }
            booster.mediaNodes.set(media, node)

            // Lifecycle listeners
            const handlePlay = () => {
                booster.playingElements.add(media)

                // Fully reset the chain to avoid duplicate connections
                try {
                    node.source.disconnect()
                    node.gain.disconnect()
                } catch (e) {}

                node.source.connect(node.gain)
                node.gain.connect(booster.audioContext.destination)
                updateAudioContextState()
            }
            const handlePause = () => {
                booster.playingElements.delete(media)

                // Completely break the audio chain to release the stream
                try {
                    node.source.disconnect()
                    node.gain.disconnect()
                } catch (e) {}

                updateAudioContextState()
            }

            media.addEventListener('play', handlePlay)
            media.addEventListener('pause', handlePause)
            media.addEventListener('ended', handlePause)

            // Sync initial state
            if (!media.paused) {
                handlePlay()
            } else {
                handlePause()
            }

            return node
        } catch {
            return null
        }
    }

    function updateAudioContextState() {
        if (!booster.audioContext) return

        if (booster.playingElements.size > 0) {
            if (booster.audioContext.state === 'suspended') {
                booster.audioContext.resume().catch(() => {})
            }
        } else {
            if (booster.audioContext.state === 'running') {
                booster.audioContext.suspend().catch(() => {})
            }
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

    async function getStorage(defaults) {
        return await chrome.storage.sync.get(defaults)
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
