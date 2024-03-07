// ==UserScript==
// @name         GeoGuessr Team Duels Auto Lock
// @description  Guesses in Antartica after everyone else locks in, allowing the round to end early
// @version      1.0
// @author       notsopoisonous
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @downloadURL  https://github.com/ivyrze/geoguessr-userscripts/raw/main/teamduels-autolock.user.js
// @updateURL    https://github.com/ivyrze/geoguessr-userscripts/raw/main/teamduels-autolock.user.js
// ==/UserScript==

const submitGuess = (gameId, roundNumber) => {
    const payload = {
        lat: -85,
        lng: 65,
        roundNumber
    };

    fetch(`https://game-server.geoguessr.com/api/duels/${gameId}/guess`, {
        headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache"
        },
        referrer: "https://www.geoguessr.com/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: JSON.stringify(payload),
        method: "POST",
        mode: "cors",
        credentials: "include"
    });
};

var roundNumber;

const domObserver = new MutationObserver(() => {
    if (location.pathname.indexOf("/team-duels/") !== 0) { return; }

    const newRound = document.querySelector("[class*=\"new-round_roundNumber__\"]");
    
    if (newRound) {
        // If we're starting a new round, save the round number for API calls
        roundNumber = parseInt(newRound.innerText.replace("ROUND ", ""));
    } else if (!roundNumber) {
        // Don't bother checking for locks at irrelevant times
        return;
    }

    // Once someone has locked in, submit a guess in Antarctica
    const isLocked = document.querySelector("[class*=\"health-bar_teamMemberGuessed__\"]");

    if (isLocked) {
        const guessButton = document.querySelector("[class^=\"guess-map_guessButton__\"]");
        
        // Don't auto guess if one has already been manually submitted
        if (guessButton?.children.length > 0) {
            // Submit the guess
            const gameId = location.pathname.split("/team-duels/")[1];
            submitGuess(gameId, roundNumber);
        }

        // Short circuit future attempts to auto guess this round
        roundNumber = false;
    }
});

domObserver.observe(document.querySelector("#__next"), { subtree: true, childList: true });