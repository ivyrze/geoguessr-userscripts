// ==UserScript==
// @name         GeoGuessr Bullseye Keybinding
// @description  Customizable keybinding for adjusting the bullseye circle size
// @version      1.0.1
// @author       notsopoisonous
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://github.com/ivyrze/geoguessr-userscripts/raw/main/bullseye-keybind.user.js
// @updateURL    https://github.com/ivyrze/geoguessr-userscripts/raw/main/bullseye-keybind.user.js
// ==/UserScript==

(async function() {
    'use strict';

    let configFields = {
        increaseKey: {
            label: 'Increase Size Key',
            type: 'text',
            default: '['
        },
        decreaseKey: {
            label: 'Decrease Size Key',
            type: 'text',
            default: ']'
        }
    };
    let configValues = {};

    const updateConfigValues = function () {
        Object.keys(configFields).forEach(id => {
            configValues[id] = this.get(id);
        });
    };

    /* globals GM_config */
    GM_config.init({
        id: 'bullseye-keybind',
        title: 'Bullseye Settings',
        fields: configFields,
        events: {
            save: updateConfigValues,
            init: updateConfigValues
        }
    });
    GM_registerMenuCommand("Configure", () => GM_config.open());

    const isRelevantKey = (key) => {
        return (key == configValues.increaseKey || key == configValues.decreaseKey);
    };

    document.addEventListener('keydown', (event) => {
        if (!isRelevantKey(event.key)) { return; }

        const container = document.querySelector("[class^=\"radius-controls_wrapper\"]");
        
        if (!container) { return false; }
        
        // Get index of currently selected circle size
        let selectedIndex = 5 - parseInt(container.querySelector("[class^=\"styles_rangeslider\"]").ariaValueNow);

        const increaseMode = event.key == configValues.increaseKey;
        if (increaseMode && selectedIndex < 5) {
            selectedIndex++;
        } else if (!increaseMode && selectedIndex > 0) {
            selectedIndex--;
        }

        // Find and get positioning of the to-be selected label
        const target = container.querySelector("[class^=\"styles_labels\"]").children[selectedIndex];
        const { x: clientX, y: clientY } = target.getBoundingClientRect();

        const remappedEvent = new MouseEvent('mousedown', { clientX, clientY, bubbles: true });
        const remappedEvent2 = new MouseEvent('mouseup', { clientX, clientY, bubbles: true });
        target.dispatchEvent(remappedEvent);
        target.dispatchEvent(remappedEvent2);

        return false;
    });
})();
