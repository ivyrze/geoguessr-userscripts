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

    document.addEventListener('keydown', (event) => {
        if (event.key != "t" && event.key != "g") {
            return;
        }

        const forwardMode = event.key == "t";

        const arrows = [ ...document.querySelectorAll(".gmnoprint > svg > path[role]") ];

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

        const remappedEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
        arrows[closestRotationIndex].dispatchEvent(remappedEvent);

        return false;
    });
})();