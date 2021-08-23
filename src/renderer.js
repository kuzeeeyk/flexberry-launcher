const { ipcRenderer } = require('electron')
const { getVersions, filterVersions } = require("./scripts/versions.js")
const launchMinecraft = require("./scripts/launcher.js");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const profilesAdapter = new FileSync("profiles.json");

require("./scripts/ipc")

var options = {
    versions: {
        release: false,   // releases like 1.17, 1.8 etc.
        snapshot: false,  // snapshots like 21w16a etc.
        old_alpha: false  // releases like release-candite, infdev etc.
    }
}

async function loadProfiles() {
    var profilesEl = document.getElementById("profiles");
    var profiles = low(profilesAdapter);
    profilesEl.innerHTML = "";
    (await profiles.get("versions").write()).forEach(profile => {
        console.log(profile)
        profilesEl.innerHTML += `
        <div class="profile">
            <div class="profileDetails">
                <span class="profileName">${profile.name}</span>
                <span class="profileIdentifier">${profile.version}</span>
            </div>
            <div class="profileActions">
                <span class="profileAction material-icons btn sidebarItem" onclick="selectVersion(${profile.id})" id="${profile.id}.select" onmouseleave="hoverCheck(document.getElementById('${profile.id + ".select"}'), 'Select')" onmouseover="hoverCheck(document.getElementById('${profile.id + ".select"}'), 'Select')">chevron_right</span>
                <span class="profileAction material-icons btn sidebarItem" onclick="moreOptions(${profile.id})"  id="${profile.id}.more" onmouseleave="hoverCheck(document.getElementById('${profile.id + ".more"}'), 'More')" onmouseover="hoverCheck(document.getElementById('${profile.id + ".more"}'), 'More')">more_horiz</span>
            </div>
      </div > `
    });
};
loadProfiles();
