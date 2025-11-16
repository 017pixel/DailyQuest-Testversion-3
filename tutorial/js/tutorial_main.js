/**
 * @file tutorial_main.js
 * @description Hauptlogik für das emotionale Start-Tutorial
 * Sequenz: Intro-Texte -> Namenseingabe -> Willkommen -> App-Reveal -> Feature-Tour
 */

const DQ_TUTORIAL_MAIN = {
    currentTextIndex: 0,
    playerName: '',
    continueButton: null,
    waitingForContinue: false,
    
    // Intro-Texte für die emotionale Einleitung
    introTexts: [
        'Du wurdest auserwählt, dein Leben produktiver und strukturierter zu gestalten.',
        'Ich bin das System. Meine Aufgabe ist es, dir dabei zu helfen, dein volles Potenzial zu entfalten.',
        'Aber zu Beginn, wie lautet dein Name?'
    ],
    
    /**
     * Startet das komplette Tutorial
     */
    async start() {
        console.log('Tutorial wird gestartet...');
        
        // Overlay anzeigen
        const overlay = document.getElementById('tutorial-overlay');
        if (!overlay) {
            console.error('Tutorial-Overlay nicht gefunden');
            return;
        }
        
        overlay.classList.remove('hidden');
        
        // Continue-Button initialisieren
        this.continueButton = document.getElementById('tutorial-continue-btn');
        if (this.continueButton) {
            this.continueButton.addEventListener('click', () => this.handleContinue());
        }
        
        // App-Inhalte verstecken
        this.hideAppContent();
        
        // Intro-Sequenz starten
        await this.showIntroSequence();
    },
    
    /**
     * Versteckt den App-Inhalt während des Tutorials
     */
    hideAppContent() {
        const header = document.getElementById('app-header');
        const bottomNav = document.getElementById('bottom-nav');
        const appContainer = document.getElementById('app-container');
        
        if (header) header.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
        if (appContainer) appContainer.style.opacity = '0';
    },
    
    /**
     * Zeigt den App-Inhalt wieder an
     */
    showAppContent() {
        const header = document.getElementById('app-header');
        const bottomNav = document.getElementById('bottom-nav');
        const appContainer = document.getElementById('app-container');
        
        if (header) header.style.display = '';
        if (bottomNav) bottomNav.style.display = '';
        if (appContainer) appContainer.style.opacity = '1';
    },
    
    /**
     * Zeigt die Intro-Text-Sequenz
     */
    async showIntroSequence() {
        for (let i = 0; i < this.introTexts.length; i++) {
            await this.showText(this.introTexts[i]);
            this.showContinueButton();
            await this.waitForContinue();
            this.hideContinueButton();
            await this.hideText();
            await this.delay(500);
        }
        
        // Nach den Intro-Texten -> Namenseingabe
        await this.showNameInput();
    },
    
    /**
     * Zeigt den Continue-Button
     */
    showContinueButton() {
        if (this.continueButton) {
            this.continueButton.classList.remove('hidden');
        }
    },
    
    /**
     * Versteckt den Continue-Button
     */
    hideContinueButton() {
        if (this.continueButton) {
            this.continueButton.classList.add('hidden');
        }
    },
    
    /**
     * Wartet auf Continue-Button-Klick
     */
    waitForContinue() {
        return new Promise((resolve) => {
            this.waitingForContinue = true;
            this.continueResolve = resolve;
        });
    },
    
    /**
     * Wird beim Continue-Button-Klick aufgerufen
     */
    handleContinue() {
        if (this.waitingForContinue && this.continueResolve) {
            this.waitingForContinue = false;
            this.continueResolve();
            this.continueResolve = null;
        }
    },
    
    /**
     * Zeigt einen Text an
     * @param {string} text - Der anzuzeigende Text
     */
    async showText(text) {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;
        
        container.innerHTML = `<div class="tutorial-text">${text}</div>`;
    },
    
    /**
     * Blendet den aktuellen Text aus
     */
    async hideText() {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;
        
        const textElement = container.querySelector('.tutorial-text');
        if (textElement) {
            textElement.classList.add('fade-out');
            await this.delay(800);
            container.innerHTML = '';
        }
    },
    
    /**
     * Zeigt das Namenseingabe-Feld
     */
    async showNameInput() {
        const container = document.getElementById('tutorial-text-container');
        if (!container) return;
        
        container.innerHTML = `
            <div id="tutorial-name-input-container">
                <input 
                    type="text" 
                    id="tutorial-name-input" 
                    placeholder="Dein Name..." 
                    maxlength="20"
                    autocomplete="off"
                />
                <button id="tutorial-name-submit">Bestätigen</button>
            </div>
        `;
        
        // Input-Feld Fokus geben
        const input = document.getElementById('tutorial-name-input');
        if (input) {
            setTimeout(() => input.focus(), 300);
            
            // Enter-Taste zum Bestätigen
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitName();
                }
            });
        }
        
        // Submit-Button Event
        const submitBtn = document.getElementById('tutorial-name-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitName());
        }
    },
    
    /**
     * Verarbeitet die Namenseingabe
     */
    async submitName() {
        const input = document.getElementById('tutorial-name-input');
        if (!input) return;
        
        const name = input.value.trim();
        
        if (name.length === 0) {
            // Leere Eingabe - Feedback geben
            input.style.borderColor = '#ff6b6b';
            input.placeholder = 'Bitte gib deinen Namen ein';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 1000);
            return;
        }
        
        this.playerName = name;
        
        // Namenseingabe ausblenden
        const container = document.getElementById('tutorial-name-input-container');
        if (container) {
            container.classList.add('fade-out');
            await this.delay(800);
        }
        
        // Charakter mit Namen erstellen/aktualisieren
        await this.initializeCharacterWithName(name);
        
        // Willkommens-Sequenz
        await this.showWelcomeSequence();
    },
    
    /**
     * Initialisiert den Charakter mit dem eingegebenen Namen
     * @param {string} name - Spielername
     */
    async initializeCharacterWithName(name) {
        return new Promise((resolve) => {
            const tx = DQ_DB.db.transaction(['character', 'settings'], 'readwrite');
            const charStore = tx.objectStore('character');
            const settingsStore = tx.objectStore('settings');
            
            // Charakter erstellen oder aktualisieren
            charStore.get(1).onsuccess = (e) => {
                let char = e.target.result;
                
                if (!char) {
                    // Neuen Charakter erstellen
                    char = {
                        id: 1,
                        name: name,
                        level: 1,
                        mana: 0,
                        manaToNextLevel: 100,
                        gold: 200,
                        stats: {
                            kraft: 5,
                            ausdauer: 5,
                            beweglichkeit: 5,
                            durchhaltevermoegen: 5,
                            willenskraft: 5
                        },
                        statProgress: {
                            kraft: 0,
                            ausdauer: 0,
                            beweglichkeit: 0,
                            durchhaltevermoegen: 0,
                            willenskraft: 0
                        },
                        equipment: {
                            weapons: [],
                            armor: null
                        },
                        inventory: [],
                        combat: {
                            attack: 0,
                            protection: 0,
                            hpMax: 100,
                            hpCurrent: 100
                        }
                    };
                } else {
                    // Existierenden Charakter aktualisieren
                    char.name = name;
                }
                
                charStore.put(char);
            };
            
            // Einstellungen mit Calisthenics und Schwierigkeit 2 setzen
            settingsStore.get(1).onsuccess = (e) => {
                let settings = e.target.result;
                
                if (!settings) {
                    settings = {
                        id: 1,
                        goal: 'calisthenics',
                        difficulty: 2,
                        restDays: 1,
                        language: 'de',
                        theme: 'dark',
                        weightTracking: false
                    };
                } else {
                    settings.goal = 'calisthenics';
                    settings.difficulty = 2;
                }
                
                settingsStore.put(settings);
                
                // Aktualisiere DQ_CONFIG.userSettings sofort
                if (typeof DQ_CONFIG !== 'undefined') {
                    DQ_CONFIG.userSettings = settings;
                }
            };
            
            tx.oncomplete = () => {
                console.log(`Charakter initialisiert: ${name}, Ziel: Calisthenics, Schwierigkeit: 2`);
                resolve();
            };
            
            tx.onerror = (event) => {
                console.error('Fehler beim Initialisieren des Charakters:', event);
                resolve();
            };
        });
    },
    
    /**
     * Zeigt die Willkommens-Sequenz
     */
    async showWelcomeSequence() {
        const welcomeTexts = [
            `Herzlich Willkommen ${this.playerName}, ich bin gespannt, wie unsere Reise verlaufen wird.`,
            'Was jetzt kommen wird, wird dein Leben verändern. Es wird dein Leben produktiver und strukturierter machen!',
            'Das hier, ist DailyQuest:'
        ];
        
        for (let i = 0; i < welcomeTexts.length; i++) {
            const text = welcomeTexts[i];
            await this.showText(text);
            
            // Beim letzten Text: 3 Sekunden warten, dann automatisch weiter
            if (i === welcomeTexts.length - 1) {
                await this.delay(3000);
            } else {
                // Bei anderen Texten: Weiter-Button anzeigen
                this.showContinueButton();
                await this.waitForContinue();
                this.hideContinueButton();
            }
            
            await this.hideText();
            await this.delay(500);
        }
        
        // App-Reveal starten
        await this.revealApp();
    },
    
    /**
     * Enthüllt die App mit der Slide-Up Animation
     */
    async revealApp() {
        // App-Inhalte einblenden (aber noch unter dem schwarzen Overlay)
        this.showAppContent();
        
        // Overlay nach oben gleiten lassen
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.add('reveal');
            await this.delay(1500); // Animation dauert 1.5s
        }
        
        // Overlay komplett entfernen
        if (overlay) {
            overlay.classList.add('hidden');
        }
        
        // Kurze Pause, damit User die App sieht
        await this.delay(1000);
        
        // Feature-Tour starten
        await this.startFeatureTour();
    },
    
    /**
     * Startet die Feature-Tour
     */
    async startFeatureTour() {
        if (typeof DQ_TUTORIAL_TOUR !== 'undefined') {
            await DQ_TUTORIAL_TOUR.startTour();
        } else {
            console.error('DQ_TUTORIAL_TOUR nicht gefunden');
            // Fallback: Tutorial trotzdem als abgeschlossen markieren
            await DQ_TUTORIAL_STATE.setTutorialCompleted();
        }
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
    window.DQ_TUTORIAL_MAIN = DQ_TUTORIAL_MAIN;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_MAIN:', e);
}
