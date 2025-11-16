/**
 * @file tutorial_dynamic.js
 * @description Dynamische Tutorial-Schritte für einzelne Seiten beim ersten Besuch
 * Zeigt Erklärungen für Fokus, Shop, Extra Quest, Character und Dungeon
 */

const DQ_TUTORIAL_DYNAMIC = {
    // Speichert welche Seiten bereits erklärt wurden
    explainedPages: {
        'page-fokus': false,
        'page-shop': false,
        'page-extra-quest': false,
        'page-character': false,
        'page-dungeon': false
    },
    
    // Speichert ob Dungeon bereits erklärt wurde
    dungeonExplained: false,
    
    // Speichert ob alle Seiten besucht wurden
    allPagesVisited: false,
    
    /**
     * Initialisiert den dynamischen Tutorial-Status aus der DB
     */
    async initialize() {
        try {
            const state = await this.loadState();
            if (state) {
                this.explainedPages = state.explainedPages || this.explainedPages;
                this.dungeonExplained = state.dungeonExplained || false;
                this.allPagesVisited = state.allPagesVisited || false;
            }
        } catch (error) {
            console.warn('Fehler beim Laden des dynamischen Tutorial-Status:', error);
        }
    },
    
    /**
     * Prüft ob eine Seite erklärt werden soll und zeigt das Tutorial
     * @param {string} pageId - ID der Seite
     */
    async checkAndShowTutorial(pageId) {
        // Nur wenn Haupt-Tutorial abgeschlossen ist
        const hasCompletedMain = await DQ_TUTORIAL_STATE.hasCompletedTutorial();
        if (!hasCompletedMain) return;
        
        // Nur wenn wir nicht im Tutorial-Modus sind
        if (window.DQ_TUTORIAL_IN_PROGRESS) return;
        
        // Spezialfall: Wenn Übungsseite und alle anderen Seiten besucht wurden, zeige Dungeon-Tutorial
        if (pageId === 'page-exercises') {
            await this.checkAllPagesVisited();
            // Wenn alle Seiten besucht wurden und Dungeon noch nicht erklärt, zeige es
            if (this.allPagesVisited && !this.dungeonExplained) {
                await this.showDungeonTutorial();
                return;
            }
            // Normale Übungsseite hat kein Tutorial, also einfach zurückkehren
            return;
        }
        
        // Prüfe ob diese Seite bereits erklärt wurde
        if (this.explainedPages[pageId]) return;
        
        // Zeige Tutorial für diese Seite
        await this.showPageTutorial(pageId);
        
        // Markiere Seite als erklärt
        this.explainedPages[pageId] = true;
        await this.saveState();
        
        // Prüfe ob alle Seiten besucht wurden
        await this.checkAllPagesVisited();
    },
    
    /**
     * Zeigt das Tutorial für eine spezifische Seite
     * @param {string} pageId - ID der Seite
     */
    async showPageTutorial(pageId) {
        const tutorials = {
            'page-fokus': [
                {
                    element: '#page-fokus',
                    title: 'Fokus - Dein mentaler Vorteil',
                    text: 'Der Körper ist nur die Hälfte. Hier trainierst du deinen Geist. Starte den Timer, tauche ein, konzentriere dich. Je tiefer du gehst, desto mehr wirst du belohnt.',
                    forceBottom: true
                }
            ],
            'page-shop': [
                {
                    element: '#page-shop',
                    title: 'Der Shop - Deine Ausrüstung',
                    text: 'Investiere dein Gold weise. Waffen steigern deinen Angriff, Rüstung schützt dich. Mana-Steine? Die beschleunigen deinen Aufstieg erheblich.',
                    forceBottom: true
                }
            ],
            'page-extra-quest': [
                {
                    element: '#extra-quest-inactive',
                    title: 'Extra Quest - Für die Mutigen',
                    text: 'Eine zusätzliche Herausforderung. Die Belohnungen sind hoch, aber Scheitern kostet dich. Level, Gold, Stats - alles steht auf dem Spiel. Wähle weise.',
                    forceBottom: true
                }
            ],
            'page-character': [
                {
                    element: '#character-sheet-container',
                    title: 'Dein Charakter - Dein Fortschritt',
                    text: 'Das bist du. Level, Mana, Gold - deine Entwicklung auf einen Blick. Jede Quest formt dich. Jeder Level bringt dich näher zu deinen Zielen. Ich beobachte jeden Schritt.'
                },
                {
                    element: '#character-stats',
                    title: 'Deine fünf Säulen',
                    text: 'Kraft, Ausdauer, Beweglichkeit, Durchhaltevermögen, Willenskraft. Jede Quest stärkt diese Attribute. Das hier ist der echte Beweis deiner Transformation.',
                    scrollTo: '#character-stats',
                    forceBottom: true
                },
                {
                    element: '#streak-box',
                    title: 'Dein Streak - Beständigkeit zählt',
                    text: 'Schließe jeden Tag alle Quests ab. Dein Streak wächst. Ich belohne keine Talente - ich belohne Disziplin. Beständigkeit ist alles.'
                }
            ],
            'page-dungeon': [
                {
                    element: '#dungeon-root',
                    title: 'Willkommen im Dungeon',
                    text: 'Du bist in einem gefährlichen Dungeon gelandet. Hier kämpfst du gegen Monster, um wertvolle Belohnungen zu erhalten. Jeder Sieg macht dich stärker.',
                    forceBottom: true
                },
                {
                    element: '.dungeon-monster-card',
                    title: 'Dein Gegner',
                    text: 'Das ist dein Gegner. Sieh dir seine Lebenspunkte und seinen Schaden an. Plane deine Strategie. Jeder Schlag zählt.',
                    forceBottom: true
                },
                {
                    element: '.dungeon-player-status',
                    title: 'Deine Stats',
                    text: 'Das bist du im Kampf. Deine Lebenspunkte, dein Angriff, dein Schutz - alles was du brauchst, um zu überleben und zu siegen.',
                    forceBottom: true
                },
                {
                    element: '.dungeon-actions',
                    title: 'Kämpfen',
                    text: 'Wähle Übungen aus, um anzugreifen. Jede Übung verursacht Schaden basierend auf deinen Stats. Schließe sie ab, um den Schaden zu verursachen. Besiege das Monster, um Belohnungen zu erhalten!',
                    forceBottom: true
                }
            ]
        };
        
        const steps = tutorials[pageId];
        if (!steps) return;
        
        // Zeige jeden Schritt mit Verzögerung
        for (let i = 0; i < steps.length; i++) {
            await this.showDynamicStep(steps[i]);
            
            // Warte auf Benutzer-Bestätigung (immer, auch beim letzten Schritt)
            await this.waitForDynamicContinue();
        }
        
        // Entferne Highlight am Ende
        this.removeDynamicHighlight();
        
        // Verstecke Info-Box am Ende
        const infoBox = document.getElementById('tutorial-dynamic-info');
        if (infoBox) {
            infoBox.classList.remove('active');
        }
        
        // Verstecke Overlay am Ende
        const overlay = document.getElementById('tutorial-dynamic-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },
    
    /**
     * Zeigt einen einzelnen dynamischen Tutorial-Schritt
     * @param {object} step - Der Schritt mit element, title, text
     */
    async showDynamicStep(step) {
        // Erstelle oder hole Tutorial-Overlay für dynamische Schritte
        let overlay = document.getElementById('tutorial-dynamic-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'tutorial-dynamic-overlay';
            overlay.className = 'tutorial-dynamic-overlay';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
        
        // Scrolle zu Element falls nötig
        if (step.scrollTo) {
            await this.scrollToElement(step.scrollTo);
            await this.delay(400);
        }
        
        // Highlight Element
        if (step.element) {
            this.highlightDynamicStep(step.element);
        }
        
        // Zeige Info-Box
        await this.showDynamicInfoBox(step.title, step.text, step.forceBottom, step.forceTop);
    },
    
    /**
     * Hebt ein Element visuell hervor
     * @param {string} selector - CSS-Selector
     */
    highlightDynamicStep(selector) {
        this.removeDynamicHighlight();
        
        const element = document.querySelector(selector);
        if (!element) return;
        
        setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const padding = 8;
            
            const highlight = document.createElement('div');
            highlight.id = 'tutorial-dynamic-highlight';
            highlight.className = 'tutorial-highlight';
            highlight.style.position = 'fixed';
            highlight.style.top = `${rect.top - padding}px`;
            highlight.style.left = `${rect.left - padding}px`;
            highlight.style.width = `${rect.width + (padding * 2)}px`;
            highlight.style.height = `${rect.height + (padding * 2)}px`;
            
            document.body.appendChild(highlight);
            
            // Update bei Scroll/Resize
            this.dynamicHighlightHandler = () => {
                const newRect = element.getBoundingClientRect();
                highlight.style.top = `${newRect.top - padding}px`;
                highlight.style.left = `${newRect.left - padding}px`;
                highlight.style.width = `${newRect.width + (padding * 2)}px`;
                highlight.style.height = `${newRect.height + (padding * 2)}px`;
            };
            
            window.addEventListener('scroll', this.dynamicHighlightHandler, { passive: true });
            window.addEventListener('resize', this.dynamicHighlightHandler, { passive: true });
        }, 100);
    },
    
    /**
     * Entfernt das dynamische Highlight
     */
    removeDynamicHighlight() {
        const highlight = document.getElementById('tutorial-dynamic-highlight');
        if (highlight) {
            highlight.remove();
        }
        
        if (this.dynamicHighlightHandler) {
            window.removeEventListener('scroll', this.dynamicHighlightHandler);
            window.removeEventListener('resize', this.dynamicHighlightHandler);
            this.dynamicHighlightHandler = null;
        }
    },
    
    /**
     * Zeigt die dynamische Info-Box
     * @param {string} title - Titel
     * @param {string} text - Text
     * @param {boolean} forceBottom - Position erzwingen (ignoriert, Box ist jetzt zentriert)
     * @param {boolean} forceTop - Position oben erzwingen (ignoriert, Box ist jetzt zentriert)
     */
    async showDynamicInfoBox(title, text, forceBottom = false, forceTop = false) {
        let infoBox = document.getElementById('tutorial-dynamic-info');
        if (!infoBox) {
            infoBox = document.createElement('div');
            infoBox.id = 'tutorial-dynamic-info';
            infoBox.className = 'tutorial-dynamic-info';
            document.body.appendChild(infoBox);
        }
        
        // Aktualisiere Inhalt
        infoBox.innerHTML = `
            <div class="tutorial-info-content">
                <h3>${title}</h3>
                <p>${text}</p>
                <button id="tutorial-dynamic-continue" class="tutorial-continue-btn">Weiter</button>
            </div>
        `;
        
        // Box ist jetzt immer zentriert durch CSS (top: 50%, transform: translate(-50%, -50%))
        // Keine inline Styles nötig
        
        infoBox.classList.add('active');
    },
    
    /**
     * Wartet auf Benutzer-Bestätigung
     */
    waitForDynamicContinue() {
        return new Promise((resolve) => {
            // Warte kurz damit Button gerendert ist
            setTimeout(() => {
                const btn = document.getElementById('tutorial-dynamic-continue');
                if (btn) {
                    const handler = () => {
                        btn.removeEventListener('click', handler);
                        resolve();
                    };
                    btn.addEventListener('click', handler);
                } else {
                    console.warn('Tutorial-Continue Button nicht gefunden');
                    resolve();
                }
            }, 100);
        });
    },
    
    /**
     * Scrollt zu einem Element
     * @param {string} selector - CSS-Selector
     */
    async scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (!element) return;
        
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            const elementTop = element.offsetTop;
            appContainer.scrollTo({
                top: elementTop - 100,
                behavior: 'smooth'
            });
        }
    },
    
    /**
     * Prüft ob alle Seiten besucht wurden
     */
    async checkAllPagesVisited() {
        const allVisited = Object.values(this.explainedPages).every(v => v === true);
        
        if (allVisited && !this.allPagesVisited) {
            this.allPagesVisited = true;
            await this.saveState();
            
            // Zeige Dungeon-Erklärung wenn noch nicht gezeigt
            if (!this.dungeonExplained) {
                await this.showDungeonTutorial();
            }
        }
    },
    
    /**
     * Zeigt die Dungeon-Erklärung am Ende
     */
    async showDungeonTutorial() {
        // Navigiere zur Übungen-Seite
        const exercisesPage = document.getElementById('page-exercises');
        const navButton = document.querySelector('[data-page="page-exercises"]');
        
        if (exercisesPage) {
            // Alle Seiten deaktivieren
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            exercisesPage.classList.add('active');
        }
        
        if (navButton) {
            document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
            navButton.classList.add('active');
        }
        
        // Header-Titel aktualisieren
        const headerTitle = document.getElementById('header-title');
        if (headerTitle && typeof DQ_DATA !== 'undefined') {
            const lang = DQ_CONFIG?.userSettings?.language || 'de';
            headerTitle.textContent = DQ_DATA.translations[lang]?.page_title_exercises || 'Übungen';
        }
        
        // App-Container nach oben scrollen
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.scrollTop = 0;
        }
        
        await this.delay(500);
        
        // Stelle sicher, dass Dungeon-Chip gespawnt wird
        if (typeof DQ_UI !== 'undefined' && DQ_UI.mountDungeonSpawnChipIfNeeded) {
            await DQ_UI.mountDungeonSpawnChipIfNeeded();
            await this.delay(300); // Warte bis Chip gerendert ist
        }
        
        // Prüfe ob Dungeon-Chip existiert, falls nicht, setze Dungeon aktiv
        let dungeonChip = document.getElementById('dungeon-spawn-chip');
        if (!dungeonChip && typeof DQ_DUNGEON_PERSIST !== 'undefined') {
            try {
                await DQ_DUNGEON_PERSIST.setActiveDungeon(true);
                await DQ_UI.mountDungeonSpawnChipIfNeeded();
                await this.delay(300);
                dungeonChip = document.getElementById('dungeon-spawn-chip');
            } catch (e) {
                console.warn('Fehler beim Spawnen des Dungeon-Chips:', e);
            }
        }
        
        // Zeige Dungeon-Erklärung
        const dungeonStep = {
            element: dungeonChip ? '#dungeon-spawn-chip' : null,
            title: 'Dungeons - Zufällige Herausforderungen',
            text: dungeonChip 
                ? 'Ein Dungeon ist erschienen! Klicke auf den Dungeon-Chip unten rechts, um hineinzugehen. In Dungeons kämpfst du gegen Monster und kannst wertvolle Belohnungen erhalten.'
                : 'Manchmal erscheinen Dungeons - gefährliche Orte voller Monster. Mit 5% Wahrscheinlichkeit spawnt ein Dungeon beim App-Start. Hier kannst du dich in echten Kämpfen beweisen!',
            forceTop: true
        };
        
        await this.showDynamicStep(dungeonStep);
        await this.waitForDynamicContinue();
        
        this.removeDynamicHighlight();
        
        // Entferne Info-Box
        const infoBox = document.getElementById('tutorial-dynamic-info');
        if (infoBox) {
            infoBox.classList.remove('active');
        }
        
        // Entferne Overlay
        const overlay = document.getElementById('tutorial-dynamic-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        this.dungeonExplained = true;
        await this.saveState();
    },
    
    /**
     * Speichert den Status in der DB
     */
    async saveState() {
        return new Promise((resolve) => {
            try {
                if (!DQ_DB.db) {
                    resolve();
                    return;
                }
                
                const tx = DQ_DB.db.transaction(['tutorial_dynamic_state'], 'readwrite');
                const store = tx.objectStore('tutorial_dynamic_state');
                
                store.put({
                    key: 'state',
                    explainedPages: this.explainedPages,
                    dungeonExplained: this.dungeonExplained,
                    allPagesVisited: this.allPagesVisited,
                    timestamp: Date.now()
                });
                
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch (error) {
                console.warn('Fehler beim Speichern des dynamischen Tutorial-Status:', error);
                resolve();
            }
        });
    },
    
    /**
     * Lädt den Status aus der DB
     */
    async loadState() {
        return new Promise((resolve) => {
            try {
                if (!DQ_DB.db) {
                    resolve(null);
                    return;
                }
                
                const tx = DQ_DB.db.transaction(['tutorial_dynamic_state'], 'readonly');
                const store = tx.objectStore('tutorial_dynamic_state');
                const request = store.get('state');
                
                request.onsuccess = () => {
                    resolve(request.result || null);
                };
                
                request.onerror = () => {
                    resolve(null);
                };
            } catch (error) {
                console.warn('Fehler beim Laden des dynamischen Tutorial-Status:', error);
                resolve(null);
            }
        });
    },
    
    /**
     * Hilfsfunktion für Verzögerungen
     * @param {number} ms - Millisekunden
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Global verfügbar machen
try {
    window.DQ_TUTORIAL_DYNAMIC = DQ_TUTORIAL_DYNAMIC;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_DYNAMIC:', e);
}
