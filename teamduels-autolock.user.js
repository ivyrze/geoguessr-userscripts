// ==UserScript==
// @name         GeoGuessr Team Duels Auto Lock
// @description  Guesses in Antartica after everyone else locks in, allowing the round to end early
// @version      1.1
// @author       notsopoisonous
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @downloadURL  https://github.com/ivyrze/geoguessr-userscripts/raw/main/teamduels-autolock.user.js
// @updateURL    https://github.com/ivyrze/geoguessr-userscripts/raw/main/teamduels-autolock.user.js
// ==/UserScript==

var roundNumber;
var isEnabled = GM_getValue("isEnabled") ?? false;

const duelsMutated = () => {
    if (!isEnabled) { return; }

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
};

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

const partyMutated = () => {
    const modeLabel = document.querySelector("[class^=\"footer-controls_gameModeButton__\"] + div h3");
    const isTeamDuels = modeLabel.innerText == "Team Duels";

    const toggleButton = document.getElementById("teamduels-autolock__toggle");

    if (isTeamDuels && !toggleButton) {
        createToggleButton();
    } else if (!isTeamDuels && toggleButton) {
        toggleButton.remove();
    }
};

const createToggleButton = () => {
    const container = document.querySelector("[class^=\"party-header_right__\"]");
    const className = container.children[0].className;

    const toggleButton = document.createElement("button");
    toggleButton.id = "teamduels-autolock__toggle";
    toggleButton.className = className;
    toggleButton.onclick = toggleEnabledState;

    const toggleButtonIcon = document.createElement("img");
    toggleButtonIcon.src = isEnabled ? antarcticaIconChecked : antarcticaIconUnchecked;
    toggleButtonIcon.width = "18";
    toggleButtonIcon.height = "18";
    toggleButton.appendChild(toggleButtonIcon);

    container.prepend(toggleButton);
};

const toggleEnabledState = () => {
    isEnabled = !isEnabled;
    GM_setValue("isEnabled", isEnabled);

    const toggleButtonIcon = document.querySelector("#teamduels-autolock__toggle > img");
    toggleButtonIcon.src = isEnabled ? antarcticaIconChecked : antarcticaIconUnchecked;
};

const domObserver = new MutationObserver(() => {
    if (location.pathname.indexOf("/team-duels/") === 0) { duelsMutated(); }
    else if (location.pathname.indexOf("/party") === 0) { partyMutated(); }
});

domObserver.observe(document.querySelector("#__next"), { subtree: true, childList: true });

// Bundled styles and images
GM_addStyle(`#teamduels-autolock__toggle {
    display: flex;
    align-items: center;
    margin-right: 10px;
}`);

const antarcticaIconChecked = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyOTAuMSAyMzcuOCI+PHBhdGggY2xhc3M9ImIiIGZpbGw9IiNmZmYiIGQ9Ik0zLjIsMzIuMmwxMC40LDIzLjcsOC4xLDYuOCwzNi4zLDIuNHYxMC41bDI4LjEtNS4yLDE0LjktMTIuOSwyLjItMzMuNCwyMS44LTE5LjNMMTc1LDBsMjEuOCwxMC45LDEyLjktMS42LDguOSwxNC4xLDIwLjEtMi40LDE1LjIsNi44LDkuMiw0Ljh2MTYuMWwyLjEsMjQuNi02LjgsNC44cy04LDQuOC0uOCw2LjgsMjEuNiwyMy4zLDIxLjYsMjMuM2w1LjksMTYuNXYxNy4zbDUsMy42LTkuOCwxMS42LTkuMyw4LjIsNi40LDExLjctMTEuMSw4LjUtMTAuMywxMS43djEyLjlsLTkuNSwxMC4zLTI4LjQsMTEuNWgtMjIuNWwtMTYuMSw1LjgtNi44LTcuOC0xNi41LjksOC45LTE3LjYtMy4yLTIyLjEtMTguNSwyLjgtMjQuMi02LTkuMywzLjItNi44LTEuMi0xNS43LDMuNi0xMi41LTguNS0xMy43LTUuMi0yLjgtNy42LTQuNC0xMC45di0xMC45bC44LTEzLjctOC4xLDEuNi0xMC45LDUuNi01LjItMTEuNiw1LjItMTYuMSw0LjQtOC4xLDQtNy4yLTcuMi00LjQsNy42LTguNS0yMC45LS44LTQtMTIuMSw1LjYtMy42LTE0LjktNS4yTDAsNDMuOWwzLjItMTEuN1oiLz48L3N2Zz4=`;
const antarcticaIconUnchecked = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNzMuOCAyMzUuNCI+PGRlZnM+PHN0eWxlPi5ie2ZpbGw6bm9uZTtzdHJva2U6I2MxNTc1NztzdHJva2UtbWl0ZXJsaW1pdDoxMDtzdHJva2Utd2lkdGg6MjdweDt9LmN7ZmlsbDojZmZmO3N0cm9rZS13aWR0aDowcHg7fTwvc3R5bGU+PC9kZWZzPjxwb2x5Z29uIGNsYXNzPSJjIiBwb2ludHM9IjMwLjggMTExIDI2LjUgMTI0LjEgMjQuOCAxMjkuNiAyNy4xIDEzNC44IDMxLjMgMTQ0LjMgMzcuOCAxNTguNyA0NC44IDE1NS4xIDQ0LjggMTU1LjIgNDUuOSAxNTcuOSA0OS40IDE2Ni42IDUxLjYgMTcyLjUgNTQgMTc4LjkgNjAuNCAxODEuNCA2Mi45IDE4Mi4zIDc0LjUgMTcwLjcgNjUuNyAxNjcuMyA2My40IDE2MS4yIDU5LjggMTUyLjMgNTkuOCAxNDMuNCA2MC41IDEzMi4zIDUzLjkgMTMzLjYgNDUgMTM4LjEgNDAuOCAxMjguNyA0NSAxMTUuNiA0OC42IDEwOSA1MS45IDEwMy4yIDQ2IDk5LjYgNTIuMiA5Mi43IDM1LjIgOTIgMzEuOSA4Mi4yIDM2LjUgNzkuMiAyNC40IDc1IDE1LjkgNTYuNyAxOC41IDQ3LjIgMjcgNjYuNSAzMy42IDcyIDYzLjEgNzMuOSA2My4xIDgyLjUgODYgNzguMyA5OC4xIDY3LjggOTkuOSA0MC42IDExNy42IDI0LjkgMTU4LjMgMjEgMTc2IDI5LjkgMTg2LjUgMjguNiAxOTMuNyA0MCAyMDYuNyAzOC41IDIxOS40IDI1LjggMjE2LjIgMjQuNCAyMTIuNCAyMi43IDIwOC4zIDIzLjIgMjAxLjQgMjQgMTk5LjIgMjAuNSAxOTQuMSAxMi41IDE4NC43IDEzLjcgMTc4LjcgMTQuNCAxNjUgNy42IDE2MS4xIDUuNiAxNTYuOCA2LjEgMTE2LjIgMTAgMTExLjMgMTAuNCAxMDcuNyAxMy43IDg5LjkgMjkuNCA4NS4zIDMzLjUgODQuOSAzOS42IDgzLjUgNjAuNSA3OS4yIDY0LjMgNzguMSA2NC41IDc4LjEgNTkuOSA2NC4xIDU5IDM5LjUgNTcuNCAzOS4zIDU3LjIgMzIuMyA0MS4yIDE1LjIgMi40IDQgNDMuMiAxLjQgNTIuNyAwIDU4IDIuMyA2MyAxMC44IDgxLjMgMTMuNCA4Ny4xIDE4LjMgODguOCAyMSA5Ni43IDIzIDEwMi44IDIyLjggMTAzIDIzLjEgMTAzLjEgMjQuMiAxMDYuNiAyOSAxMDYuOCAzMS44IDEwOC41IDMxLjIgMTA5LjcgMzAuOCAxMTEiLz48cGF0aCBjbGFzcz0iYyIgZD0iTTI2My40LDE0OS4xbDEwLjUtMTIuNC0xMS03Ljl2LTlsLS45LTIuNC00LjgtMTMuNC0uNi0xLjgtMS4xLTEuNmMtLjEtLjItMy4zLTQuOS03LjMtOS45LS42LS43LTEuMi0xLjQtMS44LTIuMWwxLS43LS43LTguNi0xLjctMTkuNHYtMTAuMmwtMTQuNywxNC43LDEuNCwxNi4yLTUuNSwzLjlzLTYuNSwzLjktLjcsNS41YzUuOSwxLjYsMTcuNiwxOSwxNy42LDE5bDQuOCwxMy40djE0LjFsNC4xLDIuOS04LDkuNC03LjYsNi43LDUuMiw5LjUtOSw2LjktOC40LDkuNXYxMC41bC03LjcsOC40LTIzLjEsOS40aC0xOC4zbC0xMy4xLDQuNy01LjUtNi4zLTEzLjQuNyw3LjItMTQuMy0yLjYtMTgtMTUuMSwyLjMtMTMuNC0zLjMtMTUuOSwxNS45LDMuMi42LDMuNy0xLjMsMy40LTEuMiwxNS40LDMuOCwyLjkuNywxLjktLjMtNC4yLDguMy0xMS43LDIzLjIsMjUuOS0xLjQsNi4xLS4zLjcuOCw2LjcsNy43LDkuNy0zLjUsMTAuNi0zLjhoMTguNmwyLjctMS4xLDIzLjEtOS40LDMuMS0xLjMsMi4zLTIuNSw3LjctOC40LDQtNC4zdi0xMC43bDMuNy00LjIsNy45LTYsMTAuMi03LjgtNS43LTEwLjQuMi0uMiw4LTkuNFoiLz48bGluZSBjbGFzcz0iYiIgeDE9IjI0OCIgeTE9IjkuNSIgeDI9IjMxLjciIHkyPSIyMjUuOSIvPjwvc3ZnPg==`;