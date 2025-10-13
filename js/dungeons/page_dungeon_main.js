const DQ_DUNGEON_MAIN = {
    currentDungeonId: 'forest-trial',
    elements: {},

    async open() {
        // Wechsel zur Dungeon-Seite
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const dungeonPage = document.getElementById('page-dungeon');
        if (dungeonPage) dungeonPage.classList.add('active');
        // Hide bottom nav during dungeon
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) bottomNav.style.display = 'none';
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) headerTitle.textContent = 'Dungeon';
        // Increment global monster level and render
        try { await DQ_DUNGEON_PERSIST.incrementLevel(); } catch {}
        await this.render();
        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.scrollTo({ top: 0, behavior: 'instant' });
    },

    async render() {
        const root = document.getElementById('dungeon-root');
        if (!root) return;
        const dungeon = (typeof DQ_DUNGEONS !== 'undefined') ? DQ_DUNGEONS.getById(this.currentDungeonId) : null;
        if (!dungeon) {
            root.innerHTML = '<div class="card"><p>Dungeon-Daten nicht gefunden.</p></div>';
            return;
        }

        // Determine random monster, scale by persistent level
        const monsters = dungeon.monsters && dungeon.monsters.length ? dungeon.monsters : [];
        const chosen = monsters.length ? monsters[Math.floor(Math.random()*monsters.length)] : { name: 'Unbekanntes Monster', image: '', baseHp: 30, baseDmg: 8 };
        let level = 1;
        try { level = await DQ_DUNGEON_PERSIST.getLevel(); } catch {}
        const scaleHp = Math.round(chosen.baseHp * (1 + 0.18 * (Math.max(1, level) - 1)));
        const scaleDmg = Math.round(chosen.baseDmg * (1 + 0.15 * (Math.max(1, level) - 1)));

        // Init combat state for this dungeon
        if (typeof DQ_DUNGEON_COMBAT !== 'undefined') {
            DQ_DUNGEON_COMBAT.initForDungeon(dungeon, { monsterName: chosen.name, level, hpMax: scaleHp, baseDamage: scaleDmg });
        }

        root.innerHTML = '';

        // Main layout wrapper
        const layout = document.createElement('div');
        layout.className = 'dungeon-layout';
        root.appendChild(layout);

        // Header row with name only
        const headerRow = document.createElement('div');
        headerRow.className = 'card';
        headerRow.innerHTML = `
            <div class="dungeon-header">
                <h2 class="dungeon-title">${dungeon.name}</h2>
            </div>
        `;
        layout.appendChild(headerRow);

        // Monster Card
        const monsterCard = document.createElement('div');
        monsterCard.className = 'card dungeon-monster-card';
        const hpMax = (typeof DQ_DUNGEON_COMBAT !== 'undefined' && DQ_DUNGEON_COMBAT.state) ? DQ_DUNGEON_COMBAT.state.monsterHpMax : scaleHp;
        const levelTxt = (typeof DQ_DUNGEON_COMBAT !== 'undefined' && DQ_DUNGEON_COMBAT.state) ? DQ_DUNGEON_COMBAT.state.monsterLevel : level;
        monsterCard.innerHTML = `
            <div class="monster-image-wrapper">
                <img id="monster-image" src="${chosen.image || ''}" alt="${chosen.name}" class="monster-image" />
            </div>
            <div class="hp-meta"><span id="monster-level">Level: ${levelTxt}</span><span id="monster-hp-text">HP: ${hpMax}/${hpMax}</span></div>
            <div class="hp-bar" aria-label="Monster HP">
                <div class="hp-fill" id="monster-hp-fill" style="width: 100%"></div>
            </div>
        `;
        layout.appendChild(monsterCard);

        // Actions with reps input
        const actionsCard = document.createElement('div');
        actionsCard.className = 'dungeon-actions';
        const actions = document.createElement('div');
        actions.className = 'content-container';
        // Render tasks with reps
        actions.innerHTML = dungeon.tasks.map(t => `
            <div class="card exercise-card" data-task-id="${t.id}">
                <div class="quest-info">
                    <h2>${t.label}</h2>
                </div>
                <div class="exercise-card-actions">
                    <input class="reps-input" type="number" min="1" max="999" value="1" aria-label="Wiederholungen">
                    <button class="action-button complete-button-small" data-action="do">OK</button>
                </div>
            </div>
        `).join('');
        layout.appendChild(actions);

        // Player status (simple)
        const playerCard = document.createElement('div');
        playerCard.className = 'card';
        let combatState = (typeof DQ_DUNGEON_COMBAT !== 'undefined') ? DQ_DUNGEON_COMBAT.state : { playerHpMax: 100, playerHp: 100, attack: 0, protection: 0 };
        // Adjust player max HP scaled by protection (e.g., +1% max HP per protection point)
        const scaledMaxHp = Math.round((combatState.playerHpMax || 100) * (1 + (Math.max(0, combatState.protection || 0) / 100)));
        // Cap current HP to new max if needed
        const clampedCurrent = Math.min(combatState.playerHp || 0, scaledMaxHp);
        combatState = { ...combatState, playerHpMax: scaledMaxHp, playerHp: clampedCurrent };
        const playerHpPercent = Math.max(0, Math.min(100, Math.round((combatState.playerHp / (combatState.playerHpMax || 1)) * 100)));
        playerCard.innerHTML = `
            <div class="dungeon-player-status">
                <div><strong>Deine HP</strong></div>
                <div class="stat-chip">⚔️ Angriff: ${combatState.attack || 0}</div>
                <div class="stat-chip">🛡️ Schutz: ${combatState.protection || 0}</div>
                <div class="hp-bar" aria-label="Spieler HP" style="grid-column: 1 / span 3;">
                    <div class="hp-fill" id="player-hp-fill" style="width: ${playerHpPercent}%"></div>
                </div>
            </div>
        `;
        root.appendChild(playerCard);

        // Events
        // Fliehen-Button entfernt

        const monsterFill = root.querySelector('#monster-hp-fill');
        const playerFill = root.querySelector('#player-hp-fill');
        const updateBars = () => {
            const st = DQ_DUNGEON_COMBAT.state;
            const monsterPercent = Math.max(0, Math.min(100, Math.round((st.monsterHp / (st.monsterHpMax || 1)) * 100)));
            const playerPercent = Math.max(0, Math.min(100, Math.round((st.playerHp / (st.playerHpMax || 1)) * 100)));
            if (monsterFill) monsterFill.style.width = monsterPercent + '%';
            if (playerFill) playerFill.style.width = playerPercent + '%';
            const hpText = document.getElementById('monster-hp-text');
            if (hpText) hpText.textContent = `HP: ${st.monsterHp}/${st.monsterHpMax}`;
        };

        // Screen damage overlay helper
        const ensureScreenDamageOverlay = () => {
            let ov = document.getElementById('screen-damage-overlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.id = 'screen-damage-overlay';
                ov.className = 'screen-damage-overlay';
                document.body.appendChild(ov);
            }
            return ov;
        };

        const monsterImg = root.querySelector('#monster-image');
        actions.querySelectorAll('.exercise-card .complete-button-small').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const card = e.currentTarget.closest('.exercise-card');
                const taskId = card && card.getAttribute('data-task-id');
                const task = dungeon.tasks.find(t => t.id === taskId);
                if (!task) return;
                const repsInput = card.querySelector('.reps-input');
                const reps = Math.max(1, Math.min(999, parseInt(repsInput && repsInput.value || '1', 10) || 1));
                const result = DQ_DUNGEON_COMBAT.applyAction(task.baseDamage * reps);
                updateBars();

                // Animations: monster takes damage (red flash), then counter (pulse) + screen vignette
                if (monsterImg) {
                    monsterImg.classList.remove('monster-hit');
                    void monsterImg.offsetWidth;
                    monsterImg.classList.add('monster-hit');
                }
                setTimeout(() => {
                    if (monsterImg) {
                        monsterImg.classList.remove('monster-pulse');
                        void monsterImg.offsetWidth;
                        monsterImg.classList.add('monster-pulse');
                    }
                    const ov = ensureScreenDamageOverlay();
                    ov.classList.remove('active');
                    void ov.offsetWidth;
                    ov.classList.add('active');
                    setTimeout(() => ov.classList.remove('active'), 350);
                }, 500);

                if (DQ_DUNGEON_COMBAT.isWin()) {
                    try {
                        await DQ_CONFIG.applyDungeonResult({ outcome: 'win', rewards: dungeon.rewards, finalPlayerHp: DQ_DUNGEON_COMBAT.state.playerHp });
                        DQ_UI.showCustomPopup(`Sieg! +${dungeon.rewards.xp} Mana ✨, +${dungeon.rewards.manaStones} Mana-Steine 💠`);
                    } catch (e) { console.error(e); }
                    const navExercises = document.querySelector('.nav-button[data-page="page-exercises"]');
                    if (navExercises) DQ_UI.handleNavClick(navExercises);
                    const bottomNav = document.getElementById('bottom-nav');
                    if (bottomNav) bottomNav.style.display = '';
                    return;
                }
                if (DQ_DUNGEON_COMBAT.isLoss()) {
                    try {
                        await DQ_CONFIG.applyDungeonResult({ outcome: 'loss', finalPlayerHp: DQ_DUNGEON_COMBAT.state.playerHp });
                        DQ_UI.showCustomPopup('Niederlage! 😵 Keine Belohnungen.');
                    } catch (e) { console.error(e); }
                    const navExercises = document.querySelector('.nav-button[data-page="page-exercises"]');
                    if (navExercises) DQ_UI.handleNavClick(navExercises);
                    const bottomNav = document.getElementById('bottom-nav');
                    if (bottomNav) bottomNav.style.display = '';
                    return;
                }
                DQ_UI.showCustomPopup(`Du triffst für ${result.playerDmg}. Du erleidest ${result.monsterDmg}.`);
            });
        });
    }
};


// Ensure global access for late-bound callers
try { window.DQ_DUNGEON_MAIN = DQ_DUNGEON_MAIN; } catch {}

