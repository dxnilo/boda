/* ══════════════════════════════════════════════════════════════
   WEDDING INVITATION - JavaScript
   Handles: Envelope animation, Countdown, Music, 
            Scroll Reveal, Copy, RSVP WhatsApp,
            Admin Panel & Personalized Link Generation
   ══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── CONFIG ───
    const CONFIG = {
        weddingDate: '2026-11-15T17:00:00',
        groomName: 'Jean',
        brideName: 'Ana',
        whatsappNumber: '573001234567',
        defaultGuest: 'Familia Invitada',
        defaultPasses: 2,
        adminPassword: 'jeananaforever',
    };

    // ─── URL PARAMS (Personalization) ───
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('invitado') || CONFIG.defaultGuest;
    const guestPasses = parseInt(urlParams.get('pases')) || CONFIG.defaultPasses;

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

    function applyPersonalization() {
        if ($guestName) {
            $guestName.textContent = guestName;
        }

        if ($guestPassesCount) {
            $guestPassesCount.textContent = guestPasses;
        }

        if ($maxPasses) {
            $maxPasses.textContent = guestPasses;
        }

        if ($rsvpGuests) {
            $rsvpGuests.innerHTML = '<option value="" disabled selected>Selecciona</option>';
            for (let i = 1; i <= guestPasses; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i === 1 ? '1 persona' : `${i} personas`;
                $rsvpGuests.appendChild(option);
            }
        }
    }

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

            tryPlayMusic();
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

    // Generate dynamic name fields based on selected cupos
    if ($rsvpGuests) {
        $rsvpGuests.addEventListener('change', function () {
            const count = parseInt(this.value);
            $rsvpNamesContainer.innerHTML = '';

            for (let i = 1; i <= count; i++) {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'rsvp-name-field form-group-lux';
                fieldDiv.style.animationDelay = `${(i - 1) * 0.1}s`;

                const label = document.createElement('label');
                label.setAttribute('for', `rsvp-attendee-${i}`);
                label.textContent = `Nombre del invitado ${i}`;

                const input = document.createElement('input');
                input.type = 'text';
                input.id = `rsvp-attendee-${i}`;
                input.name = `attendee_${i}`;
                input.placeholder = `Nombre completo del invitado ${i}`;
                input.required = true;

                fieldDiv.appendChild(label);
                fieldDiv.appendChild(input);
                $rsvpNamesContainer.appendChild(fieldDiv);
            }

            // Show message group
            $rsvpMessageGroup.style.display = 'block';
        });
    }

    // RSVP Form submission → WhatsApp
    if ($rsvpForm) {
        $rsvpForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData($rsvpForm);
            const confirm = formData.get('confirm');
            const guests = formData.get('guests');
            const message = formData.get('message') || '';

            let waMessage = '';

            if (confirm === 'si') {
                // Collect attendee names
                const attendeeNames = [];
                const count = parseInt(guests);
                for (let i = 1; i <= count; i++) {
                    const name = formData.get(`attendee_${i}`);
                    if (name) attendeeNames.push(name.trim());
                }

                waMessage = `🎉 *CONFIRMACIÓN DE ASISTENCIA* 🎉\n\n`;
                waMessage += `✅ ¡Sí asistiré a la boda de ${CONFIG.brideName} & ${CONFIG.groomName}!\n\n`;
                waMessage += `👤 *Invitado(a):* ${guestName}\n`;
                waMessage += `👥 *Cupos asignados:* ${guestPasses}\n`;
                waMessage += `✋ *Cupos utilizados:* ${count}\n\n`;
                waMessage += `📋 *Asistentes:*\n`;
                attendeeNames.forEach((name, idx) => {
                    waMessage += `   ${idx + 1}. ${name}\n`;
                });
                if (message) waMessage += `\n💌 *Dedicatoria:*\n${message}\n`;
                waMessage += `\n¡Nos vemos en la boda! 💍`;
            } else {
                const messageNo = formData.get('message_no') || '';
                waMessage = `📋 *CONFIRMACIÓN DE ASISTENCIA*\n\n`;
                waMessage += `😔 Lamentablemente no podré asistir a la boda de ${CONFIG.brideName} & ${CONFIG.groomName}.\n\n`;
                waMessage += `👤 *Invitado(a):* ${guestName}\n`;
                if (messageNo) waMessage += `\n💌 *Mensaje:*\n${messageNo}\n`;
                waMessage += `\n¡Les deseo lo mejor! 💕`;
            }

            const encoded = encodeURIComponent(waMessage);
            const waURL = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encoded}`;
            window.open(waURL, '_blank');
        });
    }

    // ══════════════════════════════════════════════════════════════
    // ADMIN PANEL
    // ══════════════════════════════════════════════════════════════

    const STORAGE_KEY = 'boda_invitations';

    // Pre-seeded guest list from Excel (MATRIMONIO EN LINEA.xlsx)
    const GUEST_LIST = [
        // Mesa 1
        { name: 'Xiomara Ariza', passes: 1 },
        { name: 'Nellys Ariza', passes: 1 },
        { name: 'Javier Ariza', passes: 1 },
        { name: 'Auris Fontalvo', passes: 1 },
        { name: 'Jaime Zuluaga', passes: 1 },
        { name: 'Monica Ariza', passes: 1 },
        { name: 'Maruja Mejia', passes: 1 },
        { name: 'Esther Charris', passes: 1 },
        { name: 'Jose Charris Charris', passes: 1 },
        { name: 'Roberto Charris Charris', passes: 1 },
        { name: 'Zander Castro', passes: 1 },
        { name: 'Rocio Ariza', passes: 1 },
        { name: 'Erlinda Charris', passes: 1 },
        // Mesa 2
        { name: 'Xiomara Posada', passes: 1 },
        { name: 'Hugo Facette', passes: 1 },
        { name: 'Claudia Posada', passes: 1 },
        { name: 'Alfonso Caballero', passes: 1 },
        { name: 'Fabiola Alvarez', passes: 1 },
        { name: 'German Posada', passes: 1 },
        { name: 'Milena Castelar', passes: 1 },
        { name: 'Jorge Posada', passes: 1 },
        { name: 'Lucelys Taborda', passes: 1 },
        { name: 'Fabian Posada', passes: 1 },
        { name: 'Ana Posada', passes: 1 },
        { name: 'Magola Fontalvo', passes: 1 },
        { name: 'Rosiris Miranda', passes: 1 },
        // Mesa 3
        { name: 'Jose Facette', passes: 1 },
        { name: 'Ana Maria Perez', passes: 1 },
        { name: 'Fabiola Facette', passes: 1 },
        { name: 'Gustavo Amador', passes: 1 },
        { name: 'Teddy Arroyo', passes: 2 },
        { name: 'Ezequiel Martinez', passes: 1 },
        { name: 'Alba Facette', passes: 1 },
        { name: 'Yesenia Martinez', passes: 1 },
        { name: 'Bety', passes: 1 },
        { name: 'Yakelin Facette', passes: 1 },
        { name: 'Jhony Martinez', passes: 1 },
        // Mesa 4
        { name: 'Marcela Facette', passes: 1 },
        { name: 'Arturo Gomez', passes: 1 },
        { name: 'Mayra Arrazola', passes: 1 },
        { name: 'Cesar Obando', passes: 1 },
        { name: 'Yulibeth Martinez', passes: 1 },
        { name: 'Harly Mora', passes: 1 },
        { name: 'Paola Arrazola', passes: 1 },
        { name: 'Rafael Andres', passes: 1 },
        { name: 'Jose Rosado', passes: 1 },
        { name: 'Tatiana Arazola', passes: 1 },
        { name: 'Alvaro Arazola', passes: 1 },
        { name: 'Maribel Acosta', passes: 1 },
        { name: 'Andrea Benites', passes: 1 },
        { name: 'Rosiris Zabaleta', passes: 1 },
        // Mesa 5
        { name: 'Edgar Herrera', passes: 1 },
        { name: 'Beronica Charris', passes: 1 },
        { name: 'Edgar Junior Herrera', passes: 1 },
        { name: 'Milagros Herrera', passes: 1 },
        { name: 'Blanca Osorio', passes: 1 },
        { name: 'Rita Perez', passes: 1 },
        { name: 'Juani Fontalvo', passes: 1 },
        { name: 'Elias Ariza', passes: 1 },
        { name: 'Marla Retamozo', passes: 1 },
        { name: 'Gonzalo Conrado', passes: 1 },
        { name: 'Gonzalo J Conrado', passes: 1 },
        { name: 'Rafa Conrado', passes: 1 },
        { name: 'Lia Conrado', passes: 1 },
        // Mesa 6
        { name: 'Leydi Peralta', passes: 1 },
        { name: 'Ligia Agrego', passes: 1 },
        { name: 'Carolina Lugo', passes: 1 },
        { name: 'Daniela Barrios', passes: 1 },
        { name: 'Victor Mendoza', passes: 1 },
        { name: 'Dianora Hernandez', passes: 1 },
        { name: 'Familia Lemus', passes: 2 },
        { name: 'Roberto Romero', passes: 1 },
        { name: 'Ledys de Romero', passes: 1 },
        { name: 'Karla Romero', passes: 1 },
        { name: 'Marla Romero', passes: 1 },
        // Mesa 7
        { name: 'Yirman Berdugo', passes: 1 },
        { name: 'Jose Zapata', passes: 1 },
        { name: 'Luis Mancilla', passes: 1 },
        { name: 'Luisa Vazques', passes: 1 },
        { name: 'Kelly Zapata', passes: 1 },
        { name: 'Jesus Barrios', passes: 1 },
        { name: 'Sharon Lopez', passes: 1 },
        { name: 'Marley Vasquez', passes: 1 },
        { name: 'Andrea Mojica', passes: 1 },
        { name: 'Afonso Rodriguez', passes: 1 },
        { name: 'Rafael Rodriguez', passes: 1 },
        { name: 'Luis Almanza', passes: 1 },
        { name: 'Jhoana Sayas', passes: 1 },
        // Mesa 8
        { name: 'Auxy Padilla', passes: 1 },
        { name: 'Ana Vallejo', passes: 1 },
        { name: 'Maria Fernanda Salas', passes: 1 },
        { name: 'Valery Anaya', passes: 1 },
        { name: 'Javier Cuesta', passes: 1 },
        { name: 'Eliana Bermejo', passes: 1 },
        { name: 'Harold Rachad', passes: 1 },
        { name: 'Keyla Barrios', passes: 1 },
        { name: 'Jairo Estrada', passes: 1 },
        { name: 'Lilia Lora', passes: 1 },
        { name: 'Adolfo Lora', passes: 1 },
        { name: 'Mileydis Ruiz', passes: 1 },
        { name: 'Lucelys Ariza', passes: 1 },
        { name: 'Karime Fontalvo', passes: 1 },
        // Mesa 9
        { name: 'Juliana Ayala', passes: 1 },
        { name: 'Jose Consuegra', passes: 1 },
        { name: 'Nayelis Cabreras', passes: 1 },
        { name: 'Laura Galezo', passes: 1 },
        { name: 'Oscar Teran', passes: 1 },
        { name: 'Patricia Medina', passes: 1 },
        { name: 'Jairo Badillo', passes: 1 },
        { name: 'Greshel Nieto', passes: 1 },
        { name: 'Karen Pacheco', passes: 1 },
        { name: 'Sr. Bestriz', passes: 1 },
        { name: 'Yenifer Monsalve', passes: 1 },
        { name: 'Teofilo Gutierrez', passes: 1 },
        { name: 'Versuka Fontalvo', passes: 1 },
        // Mesa 10
        { name: 'Gabriela Gomez Facette', passes: 1 },
        { name: 'Daniela Posada', passes: 1 },
        { name: 'Anibal Caro', passes: 1 },
        { name: 'German Dario Posada', passes: 1 },
        { name: 'Maria Alejandra Posada', passes: 1 },
        { name: 'Jose David Puentes', passes: 1 },
        { name: 'Jorge Andres Posada', passes: 1 },
        { name: 'Andres Fontalvo', passes: 1 },
        { name: 'Carlos Fontalvo', passes: 1 },
        { name: 'Melani Fontalvo', passes: 1 },
        { name: 'Carlos Posada', passes: 1 },
        { name: 'Fabian A Posada', passes: 1 },
        { name: 'Dulce Facette', passes: 1 },
        // Mesa 11
        { name: 'Oscar Matruana', passes: 1 },
        { name: 'Julieht Pacheco', passes: 1 },
        { name: 'Maria Maturana', passes: 1 },
        { name: 'Sebastian Ariza', passes: 1 },
        { name: 'Victor Mendoza', passes: 1 },
        { name: 'Danilo Padilla', passes: 1 },
        { name: 'Stefany Truyol', passes: 1 },
        { name: 'Juan Castro', passes: 1 },
        { name: 'Josue Perez', passes: 1 },
        { name: 'Maria Charris', passes: 1 },
        { name: 'Michelle Charris', passes: 1 },
        { name: 'Kelly Barrios', passes: 1 },
        // Mesa 12
        { name: 'Diego Mejia', passes: 1 },
        { name: 'Daniela Ariza', passes: 1 },
        { name: 'Randy Ariza', passes: 1 },
        { name: 'Mery Del Castillo', passes: 1 },
        { name: 'Jair Ariza', passes: 1 },
        { name: 'Lizeht Martinez', passes: 1 },
        { name: 'Lira Perez', passes: 1 },
        { name: 'Guillermo Prieto', passes: 1 },
        { name: 'Maria Veronica Prieto', passes: 1 },
        { name: 'Guillermo A Prieto', passes: 1 },
        { name: 'Mayra De Alba', passes: 1 },
        { name: 'Brayder Prieto', passes: 1 },
        { name: 'Jhoana Sayas', passes: 1 },
        // Mesa 13
        { name: 'Yamile Gamboa', passes: 1 },
        { name: 'Roberto Polo', passes: 1 },
        { name: 'Marbel Morales', passes: 1 },
        { name: 'Ligia Ariza', passes: 1 },
        { name: 'Ana Luisa Fontalvo', passes: 1 },
        { name: 'Mireya Muriel', passes: 1 },
        { name: 'Yadira Roca', passes: 1 },
        { name: 'Liliana Caballero', passes: 1 },
        { name: 'Yakelin Roca', passes: 1 },
        { name: 'Dialmiro Berdugo', passes: 1 },
        { name: 'Verena Roca', passes: 1 },
        { name: 'Dalila De Arcos', passes: 1 },
        { name: 'Harold Rosales', passes: 1 },
        { name: 'Lucelys Ariza', passes: 1 },
        { name: 'Karime Fontalvo', passes: 1 },
        // Mesa 14
        { name: 'Sergio Facette', passes: 1 },
        { name: 'Cheo Amador', passes: 1 },
        { name: 'Jhonathan Amador', passes: 1 },
        { name: 'Heisilen Martinez', passes: 1 },
        { name: 'Yemileth Martinez', passes: 1 },
        { name: 'Sebastian Facette', passes: 1 },
        { name: 'Maria Fontalvo', passes: 1 },
        { name: 'Gabriel Manrriaga', passes: 1 },
        { name: 'Alfredo Gutierrez', passes: 1 },
        { name: 'Miladys Leal', passes: 1 },
        { name: 'Bilma Charris', passes: 1 },
        { name: 'Gualdo Pizarro', passes: 1 },
    ];

    function seedGuestListIfEmpty() {
        const existing = getInvitations();
        if (existing.length > 0) return; // already seeded or user has their own list
        const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const seeded = GUEST_LIST.map(g => ({
            name: g.name,
            passes: g.passes,
            url: generateInvitationURL(g.name, g.passes),
            date: today,
        }));
        saveInvitations(seeded);
    }

    function getInvitations() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveInvitations(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function generateInvitationURL(name, passes) {
        const base = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            invitado: name,
            pases: passes
        });
        return `${base}?${params.toString()}`;
    }

    function renderInvitationList() {
        const invitations = getInvitations();

        if (!$adminInviteList) return;

        $adminInviteList.innerHTML = '';

        if (invitations.length === 0) {
            $adminInviteList.innerHTML = '<p class="admin-empty-msg">No hay invitaciones generadas aún</p>';
        } else {
            invitations.forEach((inv, index) => {
                const item = document.createElement('div');
                item.className = 'admin-invite-item';
                item.innerHTML = `
                    <div class="admin-invite-info">
                        <div class="admin-invite-name">${escapeHtml(inv.name)}</div>
                        <div class="admin-invite-meta">
                            <span>👥 ${inv.passes} cupo(s)</span>
                            <span>📅 ${inv.date}</span>
                        </div>
                    </div>
                    <div class="admin-invite-actions">
                        <button class="admin-btn-copy-link" data-url="${escapeHtml(inv.url)}" title="Copiar link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button class="admin-btn-delete" data-index="${index}" title="Eliminar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                `;
                $adminInviteList.appendChild(item);
            });

            // Attach copy listeners
            $adminInviteList.querySelectorAll('.admin-btn-copy-link').forEach(btn => {
                btn.addEventListener('click', function () {
                    copyToClipboard(this.dataset.url);
                    this.style.color = '#4ade80';
                    setTimeout(() => { this.style.color = ''; }, 1500);
                });
            });

            // Attach delete listeners
            $adminInviteList.querySelectorAll('.admin-btn-delete').forEach(btn => {
                btn.addEventListener('click', function () {
                    const idx = parseInt(this.dataset.index);
                    const invitations = getInvitations();
                    invitations.splice(idx, 1);
                    saveInvitations(invitations);
                    renderInvitationList();
                });
            });
        }

        if ($adminInviteCount) {
            $adminInviteCount.textContent = invitations.length;
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            try { document.execCommand('copy'); } catch (e) { console.error(e); }
            document.body.removeChild(textArea);
        }
    }

    // ─── Admin trigger → open password modal ───
    if ($adminTrigger) {
        $adminTrigger.addEventListener('click', function () {
            $adminPasswordOverlay.classList.add('active');
            setTimeout(() => $adminPasswordInput.focus(), 300);
        });
    }

    // ─── Password modal close ───
    if ($adminModalClose) {
        $adminModalClose.addEventListener('click', function () {
            $adminPasswordOverlay.classList.remove('active');
            $adminPasswordInput.value = '';
            $adminPasswordError.classList.remove('visible');
        });
    }

    // Close on overlay click (outside modal)
    if ($adminPasswordOverlay) {
        $adminPasswordOverlay.addEventListener('click', function (e) {
            if (e.target === $adminPasswordOverlay) {
                $adminPasswordOverlay.classList.remove('active');
                $adminPasswordInput.value = '';
                $adminPasswordError.classList.remove('visible');
            }
        });
    }

    // ─── Password validation ───
    function validateAdminPassword() {
        const password = $adminPasswordInput.value.trim();
        if (password === CONFIG.adminPassword) {
            // Success
            $adminPasswordOverlay.classList.remove('active');
            $adminPasswordInput.value = '';
            $adminPasswordError.classList.remove('visible');

            // Show admin panel
            $adminPanel.style.display = 'block';
            $adminPanel.scrollIntoView({ behavior: 'smooth' });
            seedGuestListIfEmpty();
            renderInvitationList();
        } else {
            // Error
            $adminPasswordError.classList.add('visible');
            const field = document.querySelector('.admin-password-field');
            field.classList.remove('shake');
            // Trigger reflow to restart animation
            void field.offsetWidth;
            field.classList.add('shake');
            $adminPasswordInput.value = '';
            $adminPasswordInput.focus();
        }
    }

    if ($adminPasswordSubmit) {
        $adminPasswordSubmit.addEventListener('click', validateAdminPassword);
    }

    if ($adminPasswordInput) {
        $adminPasswordInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                validateAdminPassword();
            }
        });
    }

    // ─── Close admin panel ───
    if ($adminCloseBtn) {
        $adminCloseBtn.addEventListener('click', function () {
            $adminPanel.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ─── Generate invitation link ───
    if ($adminGenerateBtn) {
        $adminGenerateBtn.addEventListener('click', function () {
            const name = $adminGuestName.value.trim();
            const passes = parseInt($adminGuestPasses.value) || 2;

            if (!name) {
                $adminGuestName.style.borderColor = '#ff6b6b';
                $adminGuestName.focus();
                setTimeout(() => { $adminGuestName.style.borderColor = ''; }, 2000);
                return;
            }

            const url = generateInvitationURL(name, passes);

            // Show generated link
            $adminGeneratedLink.textContent = url;
            $adminLinkResult.style.display = 'block';

            // Save to localStorage
            const invitations = getInvitations();
            const now = new Date();
            invitations.unshift({
                name: name,
                passes: passes,
                url: url,
                date: now.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                })
            });
            saveInvitations(invitations);
            renderInvitationList();

            // Clear form
            $adminGuestName.value = '';
            $adminGuestPasses.value = '2';
        });
    }

    // ─── Copy generated link ───
    if ($adminCopyLink) {
        $adminCopyLink.addEventListener('click', async function () {
            const url = $adminGeneratedLink.textContent;
            await copyToClipboard(url);

            this.classList.add('copied');
            const span = this.querySelector('span');
            if (span) span.textContent = '¡Copiado!';

            setTimeout(() => {
                this.classList.remove('copied');
                if (span) span.textContent = 'Copiar';
            }, 2000);
        });
    }

    // ══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════

    applyPersonalization();

})();
