// ==UserScript==
// @name         GeoGuessr Fast Move Keybinding
// @description  Customizable key remapping for the fast move mechanic
// @version      1.0
// @author       notsopoisonous
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://github.com/ivyrze/geoguessr-userscripts/raw/main/fastmove-keybind.user.js
// @updateURL    https://github.com/ivyrze/geoguessr-userscripts/raw/main/fastmove-keybind.user.js
// ==/UserScript==

(async function() {
    'use strict';

    let configFields = {
        forwardKey: {
            label: 'Forward Key',
            type: 'text',
            default: 't'
        },
        backwardKey: {
            label: 'Backward Key',
            type: 'text',
            default: 'g'
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
        id: 'fastmove-keybind',
        title: 'Fast Move Settings',
        fields: configFields,
        events: {
            save: updateConfigValues,
            init: updateConfigValues
        }
    });
    GM_registerMenuCommand("Configure", () => GM_config.open());

    let currentArrowIndex = null;

    const getMovementArrowIndex = (arrows, forwardMode) => {
        const relativeRotations = arrows.map(arrow => {
            const transformation = arrow.getAttribute("transform");

            let rotation = transformation.match(/rotate\((.*)\)/)[1];
            rotation = Math.abs(parseFloat(rotation));
            rotation = Math.min(rotation, 360 - rotation);
            return rotation;
        });

        const closestRotationIndex = Object.keys(relativeRotations).reduce((bestIndex, currentIndex) => {
            // Minimizing function except it returns index instead of the value
            if (forwardMode) {
                return relativeRotations[bestIndex] <= relativeRotations[currentIndex] ?
                    bestIndex : currentIndex;
            } else {
                return relativeRotations[bestIndex] >= relativeRotations[currentIndex] ?
                    bestIndex : currentIndex;
            }
        }, 0);

        return closestRotationIndex;
    };

    const isRelevantKey = (key) => {
        return (key == configValues.forwardKey || key == configValues.backwardKey);
    };

    document.addEventListener('keydown', (event) => {
        if (!isRelevantKey(event.key)) { return; }

        const forwardMode = event.key == configValues.forwardKey;

        const arrows = [ ...document.querySelectorAll(".gmnoprint > svg > path[role]") ];
        if (!arrows.length) { return; }

        // Find the correct movement arrow and store it for later calls
        const arrowIndex = currentArrowIndex ?? getMovementArrowIndex(arrows, forwardMode);
        currentArrowIndex = arrowIndex;

        const remappedEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
        arrows[arrowIndex]?.dispatchEvent(remappedEvent);

        return false;
    });

    document.addEventListener('keyup', (event) => {
        if (!isRelevantKey(event.key)) { return; }
        currentArrowIndex = null;
    });
})();