// ==UserScript==
// @name         GeoGuessr Fast Move Keybinding
// @description  Customizable key remapping for the fast move mechanic
// @version      1.0
// @author       notsopoisonous
// @match        https://www.geoguessr.com/game/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @grant        none
// @downloadURL  https://github.com/ivyrze/geoguessr-userscripts/raw/main/fastmove-keybind.user.js
// @updateURL    https://github.com/ivyrze/geoguessr-userscripts/raw/main/fastmove-keybind.user.js
// ==/UserScript==

(function() {
    'use strict';

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
        return (key == "t" || key == "g");
    };

    document.addEventListener('keydown', (event) => {
        if (!isRelevantKey(event.key)) { return; }

        const forwardMode = event.key == "t";

        // Find the correct movement arrow and store it for later calls
        const arrows = [ ...document.querySelectorAll(".gmnoprint > svg > path[role]") ];
        const arrowIndex = currentArrowIndex ?? getMovementArrowIndex(arrows, forwardMode);
        currentArrowIndex = arrowIndex;

        const remappedEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
        arrows?.[arrowIndex].dispatchEvent(remappedEvent);

        return false;
    });

    document.addEventListener('keyup', (event) => {
        if (!isRelevantKey(event.key)) { return; }
        currentArrowIndex = null;
    });
})();