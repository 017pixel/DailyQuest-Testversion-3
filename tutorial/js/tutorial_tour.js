/**
 * @file tutorial_tour.js
 * @description Feature-Tour durch die App - System erklärt alle Funktionen
 * Führt durch: Übungen, Fokus, Shop, Extra Quest, Character
 */

const DQ_TUTORIAL_TOUR = {
    currentStep: 0,
    tourSteps: [],
    highlightElement: null,
    isTransitioning: false,
    
    /**
     * Initialisiert die Tour-Schritte
     */
    initTourSteps() {
        this.tourSteps = [
            // === ÜBUNGEN SEITE ===
            {
                page: 'page-exercises',
                element: '#daily-quest-container',
                title: 'Daily Quests - Dein täglicher Auftrag',
                text: 'Hier siehst du deine täglichen Aufgaben. Ich erstelle sie jeden Morgen neu, perfekt abgestimmt auf dein Ziel. Jede Quest formt dich stärker. Mana, Gold, Fortschritt - alles, was du für deine Transformation brauchst.'
            },
            {
                page: 'page-exercises',
                element: '#quest-list',
                title: 'Deine Quest-Liste',
                text: 'Ich habe Calisthenics auf Stufe 2 für dich gewählt - ein solider Start. Du kannst das über die Einstellungen jederzeit anpassen. Erledige deine Aufgaben und hacke sie ab.'
            },
            {
                page: 'page-exercises',
                element: '#free-training-container',
                title: 'Freies Training - Deine Wahl',
                text: 'Willst du mehr? Hier findest du alle Übungen. Wähle, was dich reizt. Filter nach Kategorie. Auch diese bringen Belohnungen - ich belohne jeden Schritt vorwärts.',
                scrollTo: '#free-training-container'
            },
            {
                page: 'page-exercises',
                element: '#settings-button',
                title: 'Deine Einstellungen',
                text: 'Hier kannst du alles anpassen. Dein Name, die Schwierigkeit, dein Trainingsziel. Ich passe mich dir an, nicht umgekehrt.'
            },
            
            // === FOKUS SEITE ===
            {
                page: 'page-fokus',
                element: '#page-fokus',
                title: 'Fokus - Dein mentaler Vorteil',
                text: 'Der Körper ist nur die Hälfte. Hier trainierst du deinen Geist. Starte den Timer, tauche ein, konzentriere dich. Je tiefer du gehst, desto mehr wirst du belohnt.'
            },
            
            // === SHOP SEITE ===
            {
                page: 'page-shop',
                element: '#page-shop',
                title: 'Der Shop - Deine Ausrüstung',
                text: 'Investiere dein Gold weise. Waffen steigern deinen Angriff, Rüstung schützt dich. Mana-Steine? Die beschleunigen deinen Aufstieg erheblich.'
            },
            
            // === EXTRA QUEST SEITE ===
            {
                page: 'page-extra-quest',
                element: '#extra-quest-inactive',
                title: 'Extra Quest - Für die Mutigen',
                text: 'Eine zusätzliche Herausforderung. Die Belohnungen sind hoch, aber Scheitern kostet dich. Level, Gold, Stats - alles steht auf dem Spiel. Wähle weise.'
            },
            
            // === CHARACTER SEITE ===
            {
                page: 'page-character',
                element: '#character-sheet-container',
                title: 'Dein Charakter - Dein Fortschritt',
                text: 'Das bist du. Level, Mana, Gold - deine Entwicklung auf einen Blick. Jede Quest formt dich. Jeder Level bringt dich der Perfektion näher. Ich beobachte jeden Schritt.'
            },
            {
                page: 'page-character',
                element: '#character-stats',
                title: 'Deine fünf Säulen',
                text: 'Kraft, Ausdauer, Beweglichkeit, Durchhaltevermögen, Willenskraft. Jede Quest stärkt diese Attribute. Das hier ist der echte Beweis deiner Transformation.',
                scrollTo: '#character-stats'
            },
            {
                page: 'page-character',
                element: '#streak-box',
                title: 'Dein Streak - Beständigkeit zählt',
                text: 'Schließe jeden Tag alle Quests ab. Dein Streak wächst. Ich belohne keine Talente - ich belohne Disziplin. Beständigkeit ist alles.'
            },
            
            // === INSTALLATION ===
            {
                page: 'page-exercises',
                element: null,
                title: 'Installiere DailyQuest',
                text: 'Damit ich immer bei dir bin: Tippe auf "Teilen" (oder das Menü) in deinem Browser und wähle "Zum Startbildschirm hinzufügen". DailyQuest wird wie eine echte App auf deinem Handy. Schneller Zugriff. Keine Ablenkung. Nur du und deine Quests.'
            },
            
            // === ABSCHLUSS ===
            {
                page: 'page-exercises',
                element: null,
                title: 'Bereit für den Anfang',
                text: 'Alles ist vorbereitet. Du hast die Werkzeuge. Jetzt liegt es an dir. Beginne deine Reise zur Perfektion. Ich bin immer hier, Jäger.'
            }
        ];
    },
    
    /**
     * Startet die Feature-Tour
     */
    async startTour() {
        this.currentStep = 0;
        this.initTourSteps();
        
        // Generiere echte Daily Quests mit Calisthenics Schwierigkeit 2
        if (typeof generateDailyQuestsIfNeeded !== 'undefined') {
            await generateDailyQuestsIfNeeded(true); // Force regenerate
        }
        
        // Alle Seiten vorladen für besseres Rendering
        await this.preloadAllPages();
        
        // Tour-Overlay aktivieren
        const tourOverlay = document.getElementById('tutorial-tour-overlay');
        const tourInfo = document.getElementById('tutorial-tour-info');
        const tourProgress = document.getElementById('tutorial-tour-progress');
        
        if (tourOverlay) tourOverlay.classList.add('active');
        if (tourProgress) tourProgress.classList.add('active');
        
        // Bottom Navigation verstecken während Tour
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) bottomNav.style.display = 'none';
        
        this.showStep(0);
    },
    
    /**
     * Lädt alle Seiten vor, damit sie im Tutorial sofort bereit sind
     */
    async preloadAllPages() {
        try {
            // Fokus-Seite
            if (typeof DQ_FOKUS_MAIN !== 'undefined' && typeof DQ_FOKUS_TIMER !== 'undefined') {
                await DQ_FOKUS_MAIN.renderPage();
                DQ_FOKUS_TIMER.renderTimerScreen();
            }
            
            // Shop-Seite
            if (typeof DQ_SHOP !== 'undefined') {
                DQ_SHOP.renderEquipmentShop();
            }
            
            // Character-Seite
            if (typeof DQ_CHARACTER_MAIN !== 'undefined') {
                await DQ_CHARACTER_MAIN.renderPage();
            }
            
            // Extra Quest-Seite
            if (typeof DQ_EXTRA !== 'undefined') {
                DQ_EXTRA.renderExtraQuestPage();
            }
            
            // Übungen-Seite: Zeige die echten Quests
            if (typeof DQ_EXERCISES !== 'undefined') {
                DQ_EXERCISES.renderQuests();
                DQ_EXERCISES.renderFreeExercisesPage();
            }
            
            console.log('Alle Seiten vorgeladen für Tutorial');
        } catch (error) {
            console.warn('Fehler beim Vorladen der Seiten:', error);
        }
    },
    
    /**
     * Zeigt einen bestimmten Tour-Schritt
     * @param {number} stepIndex - Index des Schritts
     */
    async showStep(stepIndex) {
        if (this.isTransitioning) return;
        
        if (stepIndex >= this.tourSteps.length) {
            this.endTour();
            return;
        }
        
        this.isTransitioning = true;
        this.currentStep = stepIndex;
        const step = this.tourSteps[stepIndex];
        
        // Info-Box ausblenden während Transition
        const infoBox = document.getElementById('tutorial-tour-info');
        if (infoBox) infoBox.classList.remove('active');
        
        // Zur richtigen Seite navigieren
        await this.navigateToPage(step.page);
        
        // Seiteninhalte rendern (aber nicht Quests bei bestimmten Schritten)
        await this.renderPageContent(step.page, stepIndex);
        
        // Verzögerung für Seitenwechsel und Rendering
        await this.delay(600);
        
        // Zum Element scrollen falls nötig
        if (step.scrollTo) {
            await this.scrollToElement(step.scrollTo);
            await this.delay(400);
        }
        
        // Element hervorheben
        if (step.element) {
            this.highlightStep(step.element);
        } else {
            this.removeHighlight();
        }
        
        // Info-Box aktualisieren und anzeigen
        this.updateInfoBox(step.title, step.text);
        
        this.isTransitioning = false;
    },
    
    /**
     * Navigiert zur angegebenen Seite
     * @param {string} pageId - ID der Seite
     */
    async navigateToPage(pageId) {
        return new Promise((resolve) => {
            const pages = document.querySelectorAll('.page');
            const navButtons = document.querySelectorAll('.nav-button');
            
            // Alle Seiten und Buttons deaktivieren
            pages.forEach(page => page.classList.remove('active'));
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Zielseite aktivieren
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Entsprechenden Nav-Button aktivieren
            const targetButton = document.querySelector(`[data-page="${pageId}"]`);
            if (targetButton) {
                targetButton.classList.add('active');
            }
            
            // Header-Titel aktualisieren
            this.updateHeader(pageId);
            
            // App-Container nach oben scrollen
            const appContainer = document.getElementById('app-container');
            if (appContainer) {
                appContainer.scrollTop = 0;
            }
            
            resolve();
        });
    },
    
    /**
     * Aktualisiert den Header-Titel basierend auf der Seite
     * @param {string} pageId - ID der Seite
     */
    updateHeader(pageId) {
        const headerTitle = document.getElementById('header-title');
        if (!headerTitle) return;
        
        const lang = DQ_CONFIG.userSettings.language || 'de';
        const titles = {
            'page-exercises': DQ_DATA.translations[lang]?.page_title_exercises || 'Übungen',
            'page-fokus': DQ_DATA.translations[lang]?.page_title_fokus || 'Fokus',
            'page-character': DQ_DATA.translations[lang]?.page_title_character || 'Charakter',
            'page-shop': DQ_DATA.translations[lang]?.page_title_shop || 'Shop',
            'page-extra-quest': DQ_DATA.translations[lang]?.page_title_extra_quest || 'Extra Quest'
        };
        
        headerTitle.textContent = titles[pageId] || 'Übungen';
    },
    
    /**
     * Rendert den Seiteninhalt
     * @param {string} pageId - ID der Seite
     * @param {number} stepIndex - Aktueller Schritt-Index
     */
    async renderPageContent(pageId, stepIndex) {
        try {
            switch(pageId) {
                case 'page-exercises':
                    if (typeof DQ_EXERCISES !== 'undefined') {
                        // Nur bei Schritt 1 echte Quests rendern, bei Schritt 0 und 2+ nicht nochmal
                        if (stepIndex === 1) {
                            DQ_EXERCISES.renderQuests();
                        }
                        // Freies Training immer rendern
                        DQ_EXERCISES.renderFreeExercisesPage();
                    }
                    break;
                    
                case 'page-fokus':
                    if (typeof DQ_FOKUS_MAIN !== 'undefined' && typeof DQ_FOKUS_TIMER !== 'undefined') {
                        await DQ_FOKUS_MAIN.renderPage();
                        // Stelle sicher dass Timer-Screen gerendert wird
                        DQ_FOKUS_TIMER.renderTimerScreen();
                    }
                    break;
                    
                case 'page-shop':
                    if (typeof DQ_SHOP !== 'undefined') {
                        // Verwende die richtige Methode
                        DQ_SHOP.renderPage();
                        // Warte kurz für Rendering
                        await this.delay(200);
                    }
                    break;
                    
                case 'page-character':
                    if (typeof DQ_CHARACTER_MAIN !== 'undefined') {
                        await DQ_CHARACTER_MAIN.renderPage();
                    }
                    break;
                    
                case 'page-extra-quest':
                    if (typeof DQ_EXTRA !== 'undefined') {
                        DQ_EXTRA.renderExtraQuestPage();
                    }
                    break;
            }
        } catch (error) {
            console.warn(`Fehler beim Rendern von ${pageId}:`, error);
        }
    },
    
    /**
     * Scrollt zu einem bestimmten Element
     * @param {string} selector - CSS-Selector
     */
    async scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (!element) return;
        
        const appContainer = document.getElementById('app-container');
        if (!appContainer) return;
        
        const elementTop = element.offsetTop;
        appContainer.scrollTo({
            top: elementTop - 100,
            behavior: 'smooth'
        });
    },
    
    /**
     * Hebt ein Element visuell hervor
     * @param {string} selector - CSS-Selector des Elements
     */
    highlightStep(selector) {
        this.removeHighlight();
        
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`Element ${selector} nicht gefunden`);
            return;
        }
        
        const rect = element.getBoundingClientRect();
        
        // 8px Abstand auf allen Seiten
        const padding = 8;
        
        // Highlight-Element erstellen
        this.highlightElement = document.createElement('div');
        this.highlightElement.className = 'tutorial-highlight';
        this.highlightElement.style.top = `${rect.top - padding}px`;
        this.highlightElement.style.left = `${rect.left - padding}px`;
        this.highlightElement.style.width = `${rect.width + (padding * 2)}px`;
        this.highlightElement.style.height = `${rect.height + (padding * 2)}px`;
        
        document.body.appendChild(this.highlightElement);
    },
    
    /**
     * Entfernt das Highlight
     */
    removeHighlight() {
        if (this.highlightElement) {
            this.highlightElement.remove();
            this.highlightElement = null;
        }
    },
    
    /**
     * Aktualisiert die Info-Box
     * @param {string} title - Titel
     * @param {string} text - Beschreibung
     */
    updateInfoBox(title, text) {
        const infoBox = document.getElementById('tutorial-tour-info');
        if (!infoBox) return;
        
        const titleElement = infoBox.querySelector('h3');
        const textElement = infoBox.querySelector('p');
        
        if (titleElement) titleElement.textContent = title;
        if (textElement) textElement.textContent = text;
        
        // Position der Info-Box anpassen
        this.positionInfoBox();
        
        infoBox.classList.add('active');
    },
    
    /**
     * Positioniert die Info-Box basierend auf dem Highlight-Element
     */
    positionInfoBox() {
        const infoBox = document.getElementById('tutorial-tour-info');
        if (!infoBox) return;
        
        // Standard-Position: Unten zentriert
        infoBox.style.left = '50%';
        infoBox.style.transform = 'translateX(-50%)';
        infoBox.style.bottom = '100px';
        infoBox.style.top = 'auto';
        
        // Wenn Highlight existiert, Position anpassen
        if (this.highlightElement) {
            const highlightRect = this.highlightElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // Wenn Highlight im unteren Drittel, Info-Box nach oben
            if (highlightRect.bottom > viewportHeight * 0.6) {
                const topPosition = Math.max(20, highlightRect.top - 250);
                infoBox.style.bottom = 'auto';
                infoBox.style.top = `${topPosition}px`;
            }
        }
    },
    
    /**
     * Aktualisiert den Progress-Indikator
     */
    updateProgress() {
        const progress = document.getElementById('tutorial-tour-progress');
        if (progress) {
            progress.textContent = `${this.currentStep + 1} / ${this.tourSteps.length}`;
        }
    },
    
    /**
     * Nächster Schritt
     */
    nextStep() {
        if (!this.isTransitioning) {
            this.showStep(this.currentStep + 1);
        }
    },
    
    /**
     * Beendet die Tour
     */
    async endTour() {
        // Highlight entfernen
        this.removeHighlight();
        
        // Tour-UI ausblenden
        const tourOverlay = document.getElementById('tutorial-tour-overlay');
        const tourInfo = document.getElementById('tutorial-tour-info');
        const tourProgress = document.getElementById('tutorial-tour-progress');
        
        if (tourOverlay) tourOverlay.classList.remove('active');
        if (tourInfo) tourInfo.classList.remove('active');
        if (tourProgress) tourProgress.classList.remove('active');
        
        // Bottom Navigation wieder einblenden
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) bottomNav.style.display = '';
        
        // Zurück zur Übungen-Seite
        await this.navigateToPage('page-exercises');
        
        // Tutorial als abgeschlossen markieren
        await DQ_TUTORIAL_STATE.setTutorialCompleted();
        
        console.log('Tutorial abgeschlossen');
    },
    
    /**
     * Rendert 6 Beispiel-Quests für den ersten Tutorial-Schritt
     */
    renderTutorialQuests() {
        const questList = document.getElementById('quest-list');
        if (!questList) return;
        
        questList.innerHTML = '';
        const lang = DQ_CONFIG.userSettings.language || 'de';
        
        // 6 Beispiel-Übungen für Calisthenics
        const exampleQuests = [
            { nameKey: 'pushups', target: '20 Reps' },
            { nameKey: 'pullups', target: '10 Reps' },
            { nameKey: 'squats', target: '30 Reps' },
            { nameKey: 'dips', target: '15 Reps' },
            { nameKey: 'plank', target: '60 Sek.' },
            { nameKey: 'leg_raises', target: '15 Reps' }
        ];
        
        exampleQuests.forEach((quest, index) => {
            const card = document.createElement('div');
            card.className = 'card exercise-card';
            card.dataset.questId = index;
            
            const translatedName = DQ_DATA.translations[lang]?.exercise_names[quest.nameKey] || quest.nameKey;
            
            card.innerHTML = `
                <div class="quest-info">
                    <h2>${translatedName}</h2>
                    <p class="quest-target">${quest.target}</p>
                </div>
                <div class="exercise-card-actions">
                    <button class="action-button info-button-small" data-action="info" aria-label="Info" disabled>?</button>
                    <button class="action-button complete-button-small" data-action="complete" aria-label="Absolvieren" disabled>OK</button>
                </div>
            `;
            questList.appendChild(card);
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

// Event-Listener für Next-Button
document.addEventListener('DOMContentLoaded', () => {
    const nextButton = document.getElementById('tutorial-tour-next');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            DQ_TUTORIAL_TOUR.nextStep();
        });
    }
});

// Global verfügbar machen
try {
    window.DQ_TUTORIAL_TOUR = DQ_TUTORIAL_TOUR;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_TOUR:', e);
}
