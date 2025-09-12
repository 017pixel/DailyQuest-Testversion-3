const DQ_CHARACTER = {
    weightChartScrollHandler: null, // Hält die Referenz zum Scroll-Listener

    init(elements) {
        elements.inventoryContainer.addEventListener('click', (event) => this.handleInventoryClick(event));
        elements.equipmentContainer.addEventListener('click', (event) => this.handleEquipmentClick(event));
        elements.addWeightEntryButton.addEventListener('click', () => this.showAddWeightPopup());
    },

    handleInventoryClick(event) {
        const button = event.target.closest('button.card-button');
        if (button) {
            const itemIndex = parseInt(button.dataset.inventoryIndex, 10);
            const action = button.dataset.action;
            if (action === 'use') this.useItem(itemIndex);
            else if (action === 'equip') this.equipItem(itemIndex);
            else if (action === 'sell') this.showSellConfirmation('inventory', { index: itemIndex });
        }
    },

    handleEquipmentClick(event) {
        const button = event.target.closest('button.card-button');
        if (button) {
            const action = button.dataset.action;
            const slot = button.dataset.equipSlot;
            const index = parseInt(button.dataset.equipIndex, 10);
            if (action === 'unequip') {
                this.unequipItem(slot, index);
            } else if (action === 'sell') {
                this.showSellConfirmation('equipment', { slot, index });
            }
        }
    },

    async renderPage() {
        const db = DQ_DB.db;
        if (!db) return;

        try {
            const [char, entries] = await Promise.all([
                new Promise((resolve, reject) => {
                    const tx = db.transaction('character', 'readonly');
                    const store = tx.objectStore('character');
                    const request = store.get(1);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                }),
                new Promise((resolve, reject) => {
                    const tx = db.transaction('weight_entries', 'readonly');
                    const store = tx.objectStore('weight_entries');
                    const request = store.getAll();
                    request.onsuccess = () => {
                        const sorted = request.result.sort((a, b) => new Date(a.time) - new Date(b.time));
                        resolve(sorted);
                    };
                    request.onerror = () => reject(request.error);
                })
            ]);

            if (!char) return;

            this.renderCharacterSheet(char);
            this.renderCharacterVitals(char);
            this.renderStats(char);
            this.renderWeightTracking(char, entries);
            this.renderEquipment(char);
            this.renderInventory(char);
            
            DQ_CONFIG.updateStreakDisplay();

        } catch (error) {
            console.error("Fehler beim Rendern der Charakter-Seite:", error);
        }
    },

    renderCharacterSheet(char) {
        const manaPercentage = char.manaToNextLevel > 0 ? (char.mana / char.manaToNextLevel) * 100 : 0;
        DQ_UI.elements.characterSheet.innerHTML = `
            <div class="card">
                <h2>${char.name}</h2>
                <div class="stat"><span class="stat-label">Level:</span><span class="stat-value">🌟 ${char.level}</span></div>
                <div class="stat"><span class="stat-label">Mana:</span><span class="stat-value">✨ ${char.mana} / ${char.manaToNextLevel}</span></div>
                <div class="mana-bar-container"><div class="mana-bar" style="width: ${manaPercentage}%;"></div></div>
            </div>`;
    },

    renderCharacterVitals(char) {
        const equipmentStats = this.calculateEquipmentStats(char);
        DQ_UI.elements.characterVitals.innerHTML = `
             <div class="card">
                <div class="stat"><span class="stat-label">Gold:</span><span class="stat-value">💰 ${char.gold}</span></div>
                <div class="stat"><span class="stat-label">Angriff:</span><span class="stat-value">⚔️ ${equipmentStats.angriff}</span></div>
                <div class="stat"><span class="stat-label">Schutz:</span><span class="stat-value">🛡️ ${equipmentStats.schutz}</span></div>
            </div>`;
    },

    renderStats(char) {
        const canvas = document.getElementById('stats-radar-chart');
        if (canvas) {
            this.createRadarChart(canvas, char.stats);
        }

        const statsListContainer = document.getElementById('stats-list-container');
        statsListContainer.innerHTML = ''; 

        const statsToDisplay = [
            { key: 'kraft', name: 'Kraft', emoji: '💪' },
            { key: 'ausdauer', name: 'Ausdauer', emoji: '🏃‍♂️' },
            { key: 'beweglichkeit', name: 'Beweglichkeit', emoji: '🤸‍♀️' },
            { key: 'durchhaltevermoegen', name: 'Durchhaltevermögen', emoji: '🔋' },
            { key: 'willenskraft', name: 'Willenskraft', emoji: '🧠' }
        ];

        statsToDisplay.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item-text';
            statItem.innerHTML = `
                <span>${stat.name} ${stat.emoji}</span>
                <span>${char.stats[stat.key]}</span>
            `;
            statsListContainer.appendChild(statItem);
        });
    },

    renderWeightTracking(char, entries) {
        const section = DQ_UI.elements.weightTrackingSection;
        if (!char.weightTrackingEnabled) {
            section.style.display = 'none';
            return;
        }
        section.style.display = 'block';

        const lang = DQ_CONFIG.userSettings.language || 'de';
        const summaryContainer = document.getElementById('weight-summary-container');
        const listContainer = document.getElementById('weight-entries-list');
        const canvas = document.getElementById('weight-chart');
        
        const latestEntry = entries[entries.length - 1];
        const currentWeight = latestEntry ? latestEntry.weight.toFixed(1) : '-';
        const targetWeight = char.targetWeight ? char.targetWeight.toFixed(1) : '-';

        summaryContainer.innerHTML = `
            <div class="weight-summary-item">
                <span class="label" data-lang-key="current_weight">${DQ_DATA.translations[lang].current_weight}</span>
                <span class="value">${currentWeight} kg</span>
            </div>
            <div class="weight-summary-item">
                <span class="label" data-lang-key="target_weight_display">${DQ_DATA.translations[lang].target_weight_display}</span>
                <span class="value">${targetWeight} kg</span>
            </div>
        `;

        if (entries.length > 0) {
            listContainer.innerHTML = [...entries].reverse().slice(0, 5).map(entry => {
                const dateTime = new Date(entry.time).toLocaleString(lang, { 
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                });
                return `
                    <div class="weight-entry-item">
                        <span class="date">${dateTime}</span>
                        <span class="weight">${entry.weight.toFixed(1)} kg</span>
                    </div>`;
            }).join('');
        } else {
            listContainer.innerHTML = `<p data-lang-key="no_entries">${DQ_DATA.translations[lang].no_entries}</p>`;
        }
        
        this.createWeightChart(canvas, entries, char.targetWeight);
    },

    createWeightChart(canvas, data, targetWeight) {
        const container = document.getElementById('weight-chart-container');
        if (!canvas || !canvas.getContext || container.offsetWidth === 0) {
            return;
        }

        if (this.weightChartScrollHandler) {
            container.removeEventListener('scroll', this.weightChartScrollHandler);
        }

        const pointSpacing = 50;
        const totalWidth = Math.max(container.offsetWidth, data.length * pointSpacing);
        canvas.style.width = `${totalWidth}px`;
        canvas.style.height = `220px`;

        const darkenColor = (colorStr, percent) => {
            let r, g, b;
            if (colorStr.startsWith('#')) {
                const bigint = parseInt(colorStr.slice(1), 16);
                r = (bigint >> 16) & 255; g = (bigint >> 8) & 255; b = bigint & 255;
            } else { return colorStr; }
            const factor = 1 - percent;
            r = Math.round(r * factor); g = Math.round(g * factor); b = Math.round(b * factor);
            return `rgb(${r}, ${g}, ${b})`;
        };

        const dpr = window.devicePixelRatio || 1;
        canvas.width = totalWidth * dpr;
        canvas.height = 220 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const height = 220;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };

        const style = getComputedStyle(document.documentElement);
        const gridColor = style.getPropertyValue('--outline-color').trim();
        const textColor = style.getPropertyValue('--on-surface-color').trim();
        const lineColor = style.getPropertyValue('--primary-color').trim();
        const pointColor = darkenColor(lineColor, 0.2);

        const drawChart = () => {
            const scrollLeft = container.scrollLeft;
            ctx.clearRect(0, 0, totalWidth, height);

            if (data.length === 0) {
                ctx.fillStyle = textColor;
                ctx.textAlign = 'center';
                ctx.font = '12px sans-serif';
                ctx.fillText("Bitte ersten Eintrag hinzufügen, um Diagramm zu starten.", container.offsetWidth / 2, height / 2);
                return;
            }
            
            const weights = data.map(d => Math.min(d.weight, 200));
            const buffer = 2;
            let minWeight = (targetWeight ? Math.min(...weights, targetWeight) : Math.min(...weights)) - buffer;
            let maxWeight = (targetWeight ? Math.max(...weights, targetWeight) : Math.max(...weights)) + buffer;
            minWeight = Math.max(0, minWeight);
            maxWeight = Math.min(200, maxWeight);
            const weightRange = maxWeight - minWeight < 4 ? 4 : maxWeight - minWeight;

            const getX = (index) => padding.left + (index / (data.length - 1 || 1)) * (totalWidth - padding.left - padding.right);
            const getY = (weight) => height - padding.bottom - ((Math.min(weight, 200) - minWeight) / weightRange) * (height - padding.top - padding.bottom);

            ctx.save();
            ctx.translate(-scrollLeft, 0);

            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;

            const yGridLines = 5;
            for (let i = 0; i <= yGridLines; i++) {
                const weight = minWeight + (weightRange / yGridLines) * i;
                const y = getY(weight);
                ctx.beginPath();
                ctx.moveTo(padding.left - 5 + scrollLeft, y);
                ctx.lineTo(totalWidth - padding.right + scrollLeft, y);
                ctx.stroke();
            }

            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.font = '11px sans-serif';
            const xGridLines = Math.min(data.length - 1, Math.floor(totalWidth / 70));
            if (data.length > 1) {
                for (let i = 0; i <= xGridLines; i++) {
                    const dataIndex = Math.round(i * (data.length - 1) / xGridLines);
                    const point = data[dataIndex];
                    const x = getX(dataIndex);
                    const date = new Date(point.time);
                    const label = `${date.getDate()}.${date.getMonth() + 1}.`;
                    ctx.fillText(label, x, height - padding.bottom + 15);
                }
            } else if (data.length === 1) {
                 const date = new Date(data[0].time);
                 const label = `${date.getDate()}.${date.getMonth() + 1}.`;
                 ctx.fillText(label, getX(0), height - padding.bottom + 15);
            }
            
            if (targetWeight) {
                const y = getY(targetWeight);
                ctx.beginPath();
                ctx.setLineDash([4, 4]);
                ctx.moveTo(padding.left + scrollLeft, y);
                ctx.lineTo(totalWidth - padding.right + scrollLeft, y);
                ctx.strokeStyle = textColor;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.beginPath();
            ctx.moveTo(getX(0), getY(weights[0]));
            if (data.length > 1) {
                weights.forEach((weight, index) => ctx.lineTo(getX(index), getY(weight)));
            }
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.fillStyle = pointColor;
            weights.forEach((weight, index) => {
                ctx.beginPath();
                ctx.arc(getX(index), getY(weight), 2.5, 0, 2 * Math.PI);
                ctx.fill();
            });

            ctx.restore();

            ctx.fillStyle = textColor;
            ctx.textAlign = 'right';
            ctx.font = '11px sans-serif';
            for (let i = 0; i <= yGridLines; i++) {
                const weight = minWeight + (weightRange / yGridLines) * i;
                const y = getY(weight);
                ctx.fillText(Math.round(weight), padding.left - 8 + scrollLeft, y + 4);
            }
        };

        this.weightChartScrollHandler = drawChart;
        container.addEventListener('scroll', this.weightChartScrollHandler);
        drawChart();
        
        container.scrollLeft = container.scrollWidth;
    },

    showAddWeightPopup() {
        const popup = DQ_UI.elements.addWeightPopup;
        const input = popup.querySelector('#new-weight-input');
        const saveButton = popup.querySelector('#save-weight-button');
        
        input.value = '';

        const handleSave = () => {
            const weight = parseFloat(input.value);
            if (!isNaN(weight) && weight > 0) {
                this.saveWeightEntry(weight);
                cleanup();
            }
        };
        
        const cleanup = () => {
            saveButton.removeEventListener('click', handleSave);
        };

        saveButton.addEventListener('click', handleSave, { once: true });

        DQ_UI.showPopup(popup);
    },

    async saveWeightEntry(weight) {
        const now = new Date();
        const entry = {
            date: now.toISOString().split('T')[0],
            time: now.toISOString(),
            weight: Math.min(weight, 200)
        };

        const tx = DQ_DB.db.transaction('weight_entries', 'readwrite');
        const store = tx.objectStore('weight_entries');
        store.add(entry);

        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
        
        DQ_UI.hideTopPopup();
        this.renderPage();
    },

    createRadarChart(canvas, stats) {
        const baseSize = 320;
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = baseSize * dpr;
        canvas.height = baseSize * dpr;
        canvas.style.width = `${baseSize}px`;
        canvas.style.height = `${baseSize}px`;
        ctx.scale(dpr, dpr);

        const centerX = baseSize / 2;
        const centerY = baseSize / 2;
        const radius = Math.min(centerX, centerY) * 0.75;
        
        const statKeys = ['kraft', 'ausdauer', 'beweglichkeit', 'durchhaltevermoegen', 'willenskraft'];
        const statLabels = ['💪', '🏃‍♂️', '🤸‍♀️', '🔋', '🧠'];
        const numAxes = statKeys.length;

        const highestStat = Math.max(...Object.values(stats));
        const chartBuffer = 5; 
        const baselineMax = 20; 
        const maxStatValue = Math.max(baselineMax, highestStat + chartBuffer);

        ctx.clearRect(0, 0, baseSize, baseSize);
        
        const style = getComputedStyle(document.documentElement);
        const gridColor = style.getPropertyValue('--outline-color').trim();
        const labelColor = style.getPropertyValue('--on-surface-color').trim();
        const primaryColor = style.getPropertyValue('--primary-color').trim();
        const primaryColorRgb = style.getPropertyValue('--primary-color-rgb').trim();

        const levels = 4;
        for (let level = 1; level <= levels; level++) {
            const levelRadius = (radius / levels) * level;
            ctx.beginPath();
            ctx.moveTo(centerX + levelRadius * Math.cos(-Math.PI / 2), centerY + levelRadius * Math.sin(-Math.PI / 2));
            for (let i = 1; i <= numAxes; i++) {
                const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
                ctx.lineTo(centerX + levelRadius * Math.cos(angle), centerY + levelRadius * Math.sin(angle));
            }
            ctx.closePath();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            ctx.strokeStyle = gridColor;
            ctx.stroke();
        }

        ctx.font = '24px sans-serif';
        ctx.fillStyle = labelColor;
        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            const labelRadius = radius * 1.2;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(statLabels[i], x, y);
        }
        
        ctx.beginPath();
        for (let i = 0; i < numAxes; i++) {
            const statRadius = (stats[statKeys[i]] / maxStatValue) * radius;
            const angle = (i * 2 * Math.PI / numAxes) - (Math.PI / 2);
            const x = centerX + statRadius * Math.cos(angle);
            const y = centerY + statRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.fillStyle = `rgba(${primaryColorRgb}, 0.5)`;
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    },

    renderEquipment(char) {
        const container = DQ_UI.elements.equipmentContainer;
        container.innerHTML = '';
        let hasEquipment = false;
        
        const createCard = (item, slot, index) => {
            hasEquipment = true;
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="card-actions-wrapper">
                    <button class="card-button secondary-button card-button-no-transform" data-action="sell" data-equip-slot="${slot}" data-equip-index="${index}">Verkaufen</button>
                    <button class="card-button secondary-button card-button-no-transform" data-action="unequip" data-equip-slot="${slot}" data-equip-index="${index || 0}">Ablegen</button>
                </div>`;
            container.appendChild(card);
        };

        char.equipment.weapons.forEach((item, index) => createCard(item, 'weapons', index));
        if (char.equipment.armor) createCard(char.equipment.armor, 'armor', 0);

        if (!hasEquipment) {
            container.innerHTML = '<div class="card placeholder"><p>Du trägst keine Ausrüstung. Gehe zum Shop! 🛒</p></div>';
        }
    },

    renderInventory(char) {
        const container = DQ_UI.elements.inventoryContainer;
        container.innerHTML = '';
        if (char.inventory.length > 0) {
            char.inventory.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'card';
                const buttonText = item.type === 'consumable' ? 'Benutzen' : 'Ausrüsten';
                const buttonAction = item.type === 'consumable' ? 'use' : 'equip';
                card.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="card-actions-wrapper">
                        <button class="card-button secondary-button card-button-no-transform" data-action="sell" data-inventory-index="${index}">Verkaufen</button>
                        <button class="card-button secondary-button card-button-no-transform" data-inventory-index="${index}" data-action="${buttonAction}">${buttonText}</button>
                    </div>`;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<div class="card placeholder"><p>Dein Inventar ist leer. 🤷‍♂️</p></div>';
        }
    },

    async showSellConfirmation(source, location) {
        const char = await DQ_CONFIG.getCharacter();
        if (!char) return;
        
        let itemToSell;
        if (source === 'inventory') {
            itemToSell = char.inventory[location.index];
        } else { // equipment
            itemToSell = location.slot === 'weapons' ? char.equipment.weapons[location.index] : char.equipment.armor;
        }

        if (!itemToSell || typeof itemToSell.cost === 'undefined') {
            DQ_UI.showCustomPopup("Dieser Gegenstand kann nicht verkauft werden.", 'penalty');
            return;
        }

        const sellPrice = Math.floor(itemToSell.cost * 0.7);
        const confirmationText = document.getElementById('sell-confirmation-text');
        confirmationText.innerHTML = `Möchtest du <strong>${itemToSell.name}</strong> wirklich für 💰 ${sellPrice} Gold verkaufen?`;
        
        DQ_UI.showPopup(document.getElementById('sell-popup'));

        const confirmButton = document.getElementById('confirm-sell-button');
        const cancelButton = document.getElementById('cancel-sell-button');

        const handleConfirm = () => {
            this.sellItem(source, location, sellPrice);
            cleanup();
        };
        const handleCancel = () => {
            DQ_UI.hideTopPopup();
            cleanup();
        };
        const cleanup = () => {
            confirmButton.removeEventListener('click', handleConfirm);
            cancelButton.removeEventListener('click', handleCancel);
        };

        confirmButton.addEventListener('click', handleConfirm, { once: true });
        cancelButton.addEventListener('click', handleCancel, { once: true });
    },

    sellItem(source, location, sellPrice) {
        const tx = DQ_DB.db.transaction('character', 'readwrite');
        const store = tx.objectStore('character');
        store.get(1).onsuccess = e => {
            const char = e.target.result;
            let soldItemName = '';

            if (source === 'inventory') {
                soldItemName = char.inventory[location.index].name;
                char.inventory.splice(location.index, 1);
            } else { // equipment
                if (location.slot === 'weapons') {
                    soldItemName = char.equipment.weapons[location.index].name;
                    char.equipment.weapons.splice(location.index, 1);
                } else {
                    soldItemName = char.equipment.armor.name;
                    char.equipment.armor = null;
                }
            }
            
            char.gold += sellPrice;
            char.totalGoldEarned += sellPrice; // ACHIEVEMENT-FORTSCHRITT
            store.put(char);

            tx.oncomplete = () => {
                DQ_UI.hideAllPopups();
                DQ_UI.showCustomPopup(`${soldItemName} für 💰 ${sellPrice} Gold verkauft!`);
                this.renderPage();
                DQ_SHOP.renderPage();
                DQ_ACHIEVEMENTS.checkAchievement(char, 'gold');
            };
        };
    },

    calculateEquipmentStats(character) {
        let angriff = 0;
        let schutz = 0;
        character.equipment.weapons.forEach(weapon => { angriff += weapon.bonus.angriff || 0; });
        if (character.equipment.armor) { schutz += character.equipment.armor.bonus.schutz || 0; }
        return { angriff, schutz };
    },

    useItem(itemIndex) {
        const trans = DQ_DB.db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        
        trans.oncomplete = () => this.renderPage();

        store.get(1).onsuccess = (e) => {
            let char = e.target.result;
            if (!char || !char.inventory[itemIndex]) return;
            
            const itemToUse = char.inventory[itemIndex];
            if (itemToUse.type !== 'consumable') return;

            char.mana += itemToUse.effect.mana;
            char.inventory.splice(itemIndex, 1); 

            DQ_UI.showCustomPopup(`${itemToUse.name} benutzt!\n+${itemToUse.effect.mana} Mana ✨`);

            char = DQ_CONFIG.levelUpCheck(char);

            store.put(char);
        };
    },

    equipItem(itemIndex) {
        const trans = DQ_DB.db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => this.renderPage();
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            if (!char || !char.inventory[itemIndex]) return;
            const itemToEquip = char.inventory[itemIndex];
            const slot = itemToEquip.type;
            if (slot === 'weapon') {
                if (char.equipment.weapons.length >= 2) {
                    DQ_UI.showCustomPopup("Du kannst nur 2 Waffen tragen! ⚔️⚔️");
                    return;
                }
                char.equipment.weapons.push(itemToEquip);
            } else if (slot === 'armor') {
                if (char.equipment.armor) {
                    DQ_UI.showCustomPopup("Du trägst bereits eine Rüstung. Lege sie zuerst ab! 🛡️");
                    return;
                }
                char.equipment.armor = itemToEquip;
            } else { return; }
            char.inventory.splice(itemIndex, 1);
            store.put(char);
        };
    },

    unequipItem(slot, index) {
        const trans = DQ_DB.db.transaction(['character'], 'readwrite');
        const store = trans.objectStore('character');
        trans.oncomplete = () => this.renderPage();
        store.get(1).onsuccess = (e) => {
            const char = e.target.result;
            let itemToUnequip = null;
            if (slot === 'weapons') {
                itemToUnequip = char.equipment.weapons[index];
                if (itemToUnequip) char.equipment.weapons.splice(index, 1);
            } else if (slot === 'armor') {
                itemToUnequip = char.equipment.armor;
                if (itemToUnequip) char.equipment.armor = null;
            }
            if (itemToUnequip) {
                char.inventory.push(itemToUnequip);
                store.put(char);
            }
        };
    }
};