/* ══════════════════════════════════════════════════════════════
   WEDDING INVITATION - JavaScript
   Handles: Envelope animation, Countdown, Music, 
            Scroll Reveal, Copy, RSVP WhatsApp,
            Admin Panel & Personalized Link Generation
   ══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── SUPABASE & CONFIG ───
    const SUPABASE_URL = 'https://qimqrpczkkukncfxmthu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXFycGN6a2t1a25jZnhtdGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMjA3MjUsImV4cCI6MjEwNTY5NjcyNX0.5k7bjR65hyLgmgO_MySDGkv0j6L9M-Wm_3Uii1LADk8';

    // Check if SDK loaded
    let sb = null;
    if (window.supabase) {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    const CONFIG = {
        weddingDate: '2026-12-19T17:00:00',
        whatsappNumber: '573001234567',
        defaultGuest: 'Familia Invitada',
        defaultPasses: 1
    };

    // Global state
    let guestData = {
        codigo: null,
        nombre: CONFIG.defaultGuest,
        cupos: 1,
        grupo: '',
        es_acompanante: false
    };

    const urlParams = new URLSearchParams(window.location.search);
    const guestCode = urlParams.get('codigo');

    // ─── DOM ELEMENTS ───
    const $envelopeScreen = document.getElementById('envelope-screen');
    const $envelopeVideo = document.getElementById('envelope-video');
    const $whiteOverlay = document.getElementById('white-transition-overlay');
    const $invitation = document.getElementById('invitation');
    const $musicToggle = document.getElementById('music-toggle');
    const $bgMusic = document.getElementById('bg-music');
    const $guestName = document.getElementById('guest-name');
    const $guestPassesCount = document.getElementById('guest-passes-count');
    const $maxPasses = document.getElementById('max-passes');
    const $rsvpGuests = document.getElementById('rsvp-guests');
    const $rsvpForm = document.getElementById('rsvp-form');
    const $btnCopy = document.getElementById('btn-copy-account');
    const $accountNumber = document.getElementById('account-number');
    const $copyText = document.getElementById('copy-text');

    // RSVP dynamic sections
    const $rsvpYes = document.getElementById('rsvp-yes');
    const $rsvpNo = document.getElementById('rsvp-no');
    const $rsvpDetailsYes = document.getElementById('rsvp-details-yes');
    const $rsvpDetailsNo = document.getElementById('rsvp-details-no');
    const $rsvpMessageGroup = document.getElementById('rsvp-message-group');
    const $rsvpNamesContainer = document.getElementById('rsvp-names-container');

    // Countdown elements
    const $days = document.getElementById('countdown-days');
    const $hours = document.getElementById('countdown-hours');
    const $minutes = document.getElementById('countdown-minutes');
    const $seconds = document.getElementById('countdown-seconds');

    // Admin elements
    const $adminTrigger = document.getElementById('admin-trigger-btn');
    const $adminPasswordOverlay = document.getElementById('admin-password-overlay');
    const $adminPasswordInput = document.getElementById('admin-password-input');
    const $adminPasswordSubmit = document.getElementById('admin-password-submit');
    const $adminPasswordError = document.getElementById('admin-password-error');
    const $adminModalClose = document.getElementById('admin-modal-close');
    const $adminPanel = document.getElementById('admin-panel');
    const $adminCloseBtn = document.getElementById('admin-close-btn');
    const $adminGuestName = document.getElementById('admin-guest-name');
    const $adminGuestPasses = document.getElementById('admin-guest-passes');
    const $adminGenerateBtn = document.getElementById('admin-generate-btn');
    const $adminLinkResult = document.getElementById('admin-link-result');
    const $adminGeneratedLink = document.getElementById('admin-generated-link');
    const $adminCopyLink = document.getElementById('admin-copy-link');
    const $adminInviteList = document.getElementById('admin-invite-list');
    const $adminInviteCount = document.getElementById('admin-invite-count');
    const $adminEmptyMsg = document.getElementById('admin-empty-msg');

    // ══════════════════════════════════════════════════════════════
    // PERSONALIZATION
    // ══════════════════════════════════════════════════════════════

    async function applyPersonalization() {
        if (guestCode && sb) {
            try {
                const { data, error } = await sb.from('guests').select('*').eq('codigo', guestCode).single();
                if (data) {
                    guestData = { ...data };
                }
            } catch (err) { }
        }

        if ($guestName) {
            $guestName.textContent = guestData.nombre;
        }

        if ($guestPassesCount) {
            // Un acompañante fijo solo tiene 1 cupo implícito (ya que es para él mismo), si es titular, usa los cupos
            const displayPasses = guestData.es_acompanante ? 1 : guestData.cupos;
            $guestPassesCount.textContent = displayPasses;
            if ($maxPasses) $maxPasses.textContent = displayPasses;

            guestData._displayPasses = displayPasses; // Store for form loop

            if ($rsvpGuests) {
                $rsvpGuests.innerHTML = '<option value="" disabled selected>Selecciona</option>';
                for (let i = 1; i <= displayPasses; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = i === 1 ? '1 persona' : `${i} personas`;
                    $rsvpGuests.appendChild(option);
                }
            }
        }
    }

    applyPersonalization();

    // ══════════════════════════════════════════════════════════════
    // FULLSCREEN VIDEO ENVELOPE & 4s WHITE TRANSITION
    // ══════════════════════════════════════════════════════════════

    let envelopeStarted = false;
    let transitionTriggered = false;

    function startEnvelopeVideo() {
        if (envelopeStarted) return;
        envelopeStarted = true;

        if ($envelopeVideo) {
            $envelopeVideo.muted = false;
            const playPromise = $envelopeVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    $envelopeVideo.muted = true;
                    $envelopeVideo.play().catch(e => console.error('Video play error:', e));
                });
            }

            const checkTime = () => {
                if (!transitionTriggered && $envelopeVideo.currentTime >= 4.0) {
                    transitionTriggered = true;
                    $envelopeVideo.removeEventListener('timeupdate', checkTime);
                    triggerWhiteDiffusionTransition();
                }
            };

            $envelopeVideo.addEventListener('timeupdate', checkTime);

            setTimeout(() => {
                if (!transitionTriggered) {
                    transitionTriggered = true;
                    $envelopeVideo.removeEventListener('timeupdate', checkTime);
                    triggerWhiteDiffusionTransition();
                }
            }, 4150);
        } else {
            triggerWhiteDiffusionTransition();
        }
    }

    function triggerWhiteDiffusionTransition() {
        // Start background music immediately when transition begins so there's no delay
        tryPlayMusic();

        if ($whiteOverlay) {
            $whiteOverlay.classList.add('active');
        }

        setTimeout(() => {
            if ($envelopeVideo) {
                $envelopeVideo.pause();
            }
            if ($envelopeScreen) {
                $envelopeScreen.style.display = 'none';
            }

            $invitation.classList.remove('invitation-hidden');
            $invitation.classList.add('invitation-visible');

            if ($musicToggle) {
                $musicToggle.classList.add('visible');
            }

            initScrollReveal();

            setTimeout(() => {
                if ($whiteOverlay) {
                    $whiteOverlay.classList.remove('active');
                    setTimeout(() => {
                        $whiteOverlay.style.display = 'none';
                    }, 700);
                }
            }, 200);
        }, 550);
    }

    if ($envelopeScreen) {
        $envelopeScreen.addEventListener('click', startEnvelopeVideo);
        $envelopeScreen.addEventListener('touchstart', function (e) {
            e.preventDefault();
            startEnvelopeVideo();
        }, { passive: false });
        $envelopeScreen.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEnvelopeVideo();
            }
        });
    }

    // ══════════════════════════════════════════════════════════════
    // MUSIC PLAYER
    // ══════════════════════════════════════════════════════════════

    let isMusicPlaying = false;

    function tryPlayMusic() {
        if (!$bgMusic || !$bgMusic.querySelector('source')) return;

        $bgMusic.play().then(() => {
            isMusicPlaying = true;
            $musicToggle.classList.add('playing');
        }).catch(() => {
            isMusicPlaying = false;
        });
    }

    function toggleMusic() {
        if (!$bgMusic) return;

        if (isMusicPlaying) {
            $bgMusic.pause();
            isMusicPlaying = false;
            $musicToggle.classList.remove('playing');
        } else {
            $bgMusic.play().then(() => {
                isMusicPlaying = true;
                $musicToggle.classList.add('playing');
            }).catch(() => { });
        }
    }

    if ($musicToggle) {
        $musicToggle.addEventListener('click', toggleMusic);
    }

    // ══════════════════════════════════════════════════════════════
    // COUNTDOWN TIMER
    // ══════════════════════════════════════════════════════════════

    function updateCountdown() {
        const now = new Date().getTime();
        const target = new Date(CONFIG.weddingDate).getTime();
        const diff = target - now;

        if (diff <= 0) {
            if ($days) $days.textContent = '0';
            if ($hours) $hours.textContent = '00';
            if ($minutes) $minutes.textContent = '00';
            if ($seconds) $seconds.textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if ($days) $days.textContent = days.toString();
        if ($hours) $hours.textContent = hours.toString().padStart(2, '0');
        if ($minutes) $minutes.textContent = minutes.toString().padStart(2, '0');
        if ($seconds) $seconds.textContent = seconds.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ══════════════════════════════════════════════════════════════
    // SCROLL REVEAL (IntersectionObserver)
    // ══════════════════════════════════════════════════════════════

    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');

        if (!('IntersectionObserver' in window)) {
            revealElements.forEach(el => el.classList.add('revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -30px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    }

    // ══════════════════════════════════════════════════════════════
    // PHOTO CAROUSEL (Stacked Album)
    // ══════════════════════════════════════════════════════════════

    function initCarousel() {
        const cards = document.querySelectorAll('.album-card');
        const dots = document.querySelectorAll('.album-dot');
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');

        if (!cards.length) return;

        let currentIndex = 0;
        const total = cards.length;

        function updateCarousel() {
            cards.forEach((card, idx) => {
                card.classList.remove('active', 'next-up', 'fading-out');
                card.removeAttribute('data-state');
                
                if (idx === currentIndex) {
                    card.classList.add('active');
                    card.setAttribute('data-state', 'active');
                } else if (idx === (currentIndex + 1) % total) {
                    card.classList.add('next-up');
                    card.setAttribute('data-state', 'next');
                } else {
                    card.setAttribute('data-state', 'hidden');
                }
            });

            dots.forEach((dot, idx) => {
                if (idx === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % total;
                updateCarousel();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + total) % total;
                updateCarousel();
            });
        }

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                currentIndex = idx;
                updateCarousel();
            });
        });

        // Initialize state
        updateCarousel();
    }

    initCarousel();

    // ══════════════════════════════════════════════════════════════
    // COPY ACCOUNT NUMBER
    // ══════════════════════════════════════════════════════════════

    if ($btnCopy && $accountNumber) {
        $btnCopy.addEventListener('click', async function () {
            const text = $accountNumber.textContent.replace(/\s/g, '');

            try {
                await navigator.clipboard.writeText(text);
                $btnCopy.classList.add('copied');
                if ($copyText) $copyText.textContent = '¡Copiado!';

                setTimeout(() => {
                    $btnCopy.classList.remove('copied');
                    if ($copyText) $copyText.textContent = 'Copiar número de cuenta';
                }, 2500);
            } catch {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    $btnCopy.classList.add('copied');
                    if ($copyText) $copyText.textContent = '¡Copiado!';
                    setTimeout(() => {
                        $btnCopy.classList.remove('copied');
                        if ($copyText) $copyText.textContent = 'Copiar número de cuenta';
                    }, 2500);
                } catch (e) {
                    console.error('Copy failed', e);
                }
                document.body.removeChild(textArea);
            }
        });
    }

    // ══════════════════════════════════════════════════════════════
    // ENHANCED RSVP FORM
    // ══════════════════════════════════════════════════════════════

    // Toggle sections based on attendance selection
    if ($rsvpYes) {
        $rsvpYes.addEventListener('change', function () {
            if (this.checked) {
                $rsvpDetailsYes.style.display = 'block';
                $rsvpDetailsNo.style.display = 'none';
                $rsvpMessageGroup.style.display = 'block';
                // Make guests select required
                $rsvpGuests.required = true;
            }
        });
    }

    if ($rsvpNo) {
        $rsvpNo.addEventListener('change', function () {
            if (this.checked) {
                $rsvpDetailsYes.style.display = 'none';
                $rsvpDetailsNo.style.display = 'block';
                $rsvpMessageGroup.style.display = 'none';
                // Remove required from guests and name fields
                $rsvpGuests.required = false;
                $rsvpNamesContainer.innerHTML = '';
            }
        });
    }

    // Name fields pre-fill is handled by the enhanced handler below (initCarousel section)

    // RSVP Form submission → Confirmation & Supabase Sync
    if ($rsvpForm) {
        $rsvpForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('btn-rsvp-submit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Enviando...';
            }

            const formData = new FormData($rsvpForm);
            const confirm = formData.get('confirm');
            const guests = formData.get('guests');
            const message = formData.get('message') || '';
            const messageNo = formData.get('message_no') || '';

            const attendeeNames = [];
            const count = parseInt(guests) || 1;
            if (confirm === 'si') {
                for (let i = 1; i <= count; i++) {
                    const name = formData.get(`attendee_${i}`);
                    if (name) attendeeNames.push(name.trim());
                }
            }

            // Build notes field (Combining message and attendee names if any)
            let combinedNotes = confirm === 'si' ? message : messageNo;
            if (confirm === 'si' && attendeeNames.length > 0) {
                combinedNotes = `Acompañantes confirmados: ${attendeeNames.join(', ')} | Mensaje: ${combinedNotes}`;
            }

            const newStatus = confirm === 'si' ? 'Confirmado' : 'Declinado';

            if (guestData.codigo && sb) {
                await sb.from('guests').update({
                    estado: newStatus,
                    restricciones: combinedNotes,
                    confirmado_en: new Date().toISOString()
                }).eq('codigo', guestData.codigo);
            }

            // Show feedback toast to guest
            const $toast = document.getElementById('rsvp-success-toast');
            if ($toast) {
                $toast.style.display = 'block';
                $toast.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '¡Asistencia Confirmada!';
            }
        });
    }

})();
