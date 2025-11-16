/**
 * @file tutorial_state.js
 * @description Verwaltet den Tutorial-Status in IndexedDB
 * Speichert, ob das Tutorial bereits abgespielt wurde
 */

const DQ_TUTORIAL_STATE = {
    /**
     * Prüft, ob das Tutorial bereits abgespielt wurde
     * @returns {Promise<boolean>} true wenn Tutorial bereits abgeschlossen
     */
    async hasCompletedTutorial() {
        return new Promise((resolve) => {
            try {
                if (!DQ_DB.db) {
                    resolve(false);
                    return;
                }

                const tx = DQ_DB.db.transaction(['tutorial_state'], 'readonly');
                const store = tx.objectStore('tutorial_state');
                const request = store.get('completed');

                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.value === true : false);
                };

                request.onerror = () => {
                    console.error('Fehler beim Lesen des Tutorial-Status');
                    resolve(false);
                };
            } catch (error) {
                console.error('Fehler bei hasCompletedTutorial:', error);
                resolve(false);
            }
        });
    },

    /**
     * Markiert das Tutorial als abgeschlossen
     * @returns {Promise<void>}
     */
    async setTutorialCompleted() {
        return new Promise((resolve, reject) => {
            try {
                if (!DQ_DB.db) {
                    reject(new Error('Datenbank nicht initialisiert'));
                    return;
                }

                const tx = DQ_DB.db.transaction(['tutorial_state'], 'readwrite');
                const store = tx.objectStore('tutorial_state');
                
                store.put({
                    key: 'completed',
                    value: true,
                    timestamp: Date.now()
                });

                tx.oncomplete = () => {
                    console.log('Tutorial als abgeschlossen markiert');
                    resolve();
                };

                tx.onerror = (event) => {
                    console.error('Fehler beim Speichern des Tutorial-Status:', event);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Fehler bei setTutorialCompleted:', error);
                reject(error);
            }
        });
    },

    /**
     * Setzt den Tutorial-Status zurück (für Testing)
     * @returns {Promise<void>}
     */
    async resetTutorial() {
        return new Promise((resolve, reject) => {
            try {
                if (!DQ_DB.db) {
                    reject(new Error('Datenbank nicht initialisiert'));
                    return;
                }

                const tx = DQ_DB.db.transaction(['tutorial_state'], 'readwrite');
                const store = tx.objectStore('tutorial_state');
                
                store.delete('completed');

                tx.oncomplete = () => {
                    console.log('Tutorial-Status zurückgesetzt');
                    resolve();
                };

                tx.onerror = (event) => {
                    console.error('Fehler beim Zurücksetzen des Tutorial-Status:', event);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('Fehler bei resetTutorial:', error);
                reject(error);
            }
        });
    }
};

// Global verfügbar machen
try {
    window.DQ_TUTORIAL_STATE = DQ_TUTORIAL_STATE;
} catch (e) {
    console.error('Fehler beim Exportieren von DQ_TUTORIAL_STATE:', e);
}
