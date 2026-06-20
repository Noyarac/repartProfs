import { service } from "./service.js"

function drawProfList() {
    const profList = service.getProfList()
    const profListTable = document.getElementById("profList")
    const innerHTML = "<tr><th>Nom</th><th>Heures</th></tr>" + profList.map(prof => `<tr><td>${prof.name}</td><td>${prof.quantity}</td><td>${prof.max}</td><td><button id="${prof.name}RemoveBtn">Supprimer</button></td></tr>`).join("")
    profListTable.innerHTML = innerHTML
    profList.forEach(prof => document.getElementById(`${prof.name}RemoveBtn`).addEventListener("click", () => removeProf(prof.name)))
    document.querySelectorAll("input[name*=_max], input[name*=_min]").forEach(element => element.parentElement.removeChild(element))
    profList.forEach(prof => _addProfMinMaxInputs(prof))
}

function drawGroupList() {
    const groupList = service.getGroupList()
    const groupListTable = document.getElementById("groupList")
    const innerHTML = `<tr><th>Nom</th><th>Heures Hebdo</th><th>Quantité</th>${service.getProfList().map(prof => `<th>${prof.name} min</th><th>${prof.name} max</th>`).join("")}</tr>` + groupList.map(group => `<tr><td>${group.name}</td><td>${group.heuresHebdo}</td><td>${group.quantity}</td>${service.getProfList().map(prof => `<td>${group.min[prof.name] ?? ""}</td><td>${group.max[prof.name] ?? ""}</td>`).join("")}<td><button id="${group.name}RemoveBtn">Supprimer</button></td><td><button id="${group.name}UpBtn">Haut</button></td><td><button id="${group.name}DownBtn">Bas</button></td></tr>`).join("")
    groupListTable.innerHTML = innerHTML
    groupList.forEach(group => document.getElementById(`${group.name}RemoveBtn`).addEventListener("click", () => removeGroup(group.name)))
    groupList.forEach(group => document.getElementById(`${group.name}UpBtn`).addEventListener("click", () => groupUp(group.name)))
    groupList.forEach(group => document.getElementById(`${group.name}DownBtn`).addEventListener("click", () => groupDown(group.name)))
}

function groupUp(groupName) {
    service.groupUp(groupName)
    drawGroupList()
}

function groupDown(groupName) {
    service.groupDown(groupName)
}

function _getValue(id) {
    const input = document.getElementById(id)
    const value = input.value
    input.value = null
    return value
}

function addProf(prof = undefined) {
    const newProf = prof.quantity ? prof : { name: _getValue("newProfName"), quantity: _getValue("newProfQuantity"), max: _getValue("newProfMax") }
    service.addProf(newProf)
    drawProfList()
}

function removeProf(nameOfProfToRemove) {
    service.removeProf(nameOfProfToRemove)
    drawProfList()
}

function addGroup(group = undefined) {
    const form = document.getElementById('groupForm')
    const data = Array.from(new FormData(form).entries())
    const max = Object.fromEntries(data.filter(entry => entry[0].match(/_max/)).map(entry => [entry[0].split("_max").shift(), Number.parseFloat(entry[1])]))
    const min = Object.fromEntries(data.filter(entry => entry[0].match(/_min/)).map(entry => [entry[0].split("_min").shift(), Number.parseFloat(entry[1])]))
    const newGroup = group.heuresHebdo ? group : { name: _getValue("newGroupName"), heuresHebdo: _getValue("newGroupHeuresHebdo"), quantity: _getValue("newGroupQuantity"), chair: _getValue("newGroupChair") === 1 ? true : false, min, max }
    service.addGroup(newGroup)
    drawGroupList()
}

function removeGroup(nameOfGroupToRemove) {
    service.removeGroup(nameOfGroupToRemove)
    drawGroupList()
}

function _addProfMinMaxInputs(prof) {
    const form = document.getElementById("groupForm")
    const btn = document.getElementById('addGroupBtn')
    for (const data of ["min", "max"]) {
        const element = document.createElement('input')
        element.type = "number"
        element.name = prof.name + "_" + data
        element.placeholder = prof.name + " " + data
        form.insertBefore(element, btn)
    }
}

function _removeProfMinMaxInputs(prof) {
    const inputs = document.querySelectorAll(`input[name=${prof.name}_max], input[name=${prof.name}_min]`)
    inputs.forEach(element => element.parentElement.removeChild(element))
}

function fixtures() {
    service.clearMemory()
    addProf({ name: "Stéphanie", quantity: 18, max: 23 })
    addProf({ name: "Béné", quantity: 6, max: 6.3 })
    addProf({ name: "Aurélie", quantity: 18, max: 23 })
    addGroup({ name: "2nd SES", heuresHebdo: 1.5, quantity: 6, chair: false, max: { "Stéphanie": 3, "Aurélie": 3, "Béné": 3 }, min: { "Aurélie": 1, "Stéphanie": 2 } }) // Aurélie min 1
    addGroup({ name: "2nd AP", heuresHebdo: 1, quantity: 1, chair: false, max: { "Stéphanie": 0, "Béné": 0 }, min: {} }) // que Aurélie
    addGroup({ name: "1re SES", heuresHebdo: 4, quantity: 3, chair: true, max: { "Stéphanie": 1, "Aurélie": 2, "Béné": 2 }, min: {"Béné": 1} })
    addGroup({ name: "1re EPPCS", heuresHebdo: 1, quantity: 1, chair: true, max: { "Aurélie": 0, "Stéphanie": 0 }, min: {"Béné": 1} }) // que Béné
    addGroup({ name: "1re AP", heuresHebdo: 1, quantity: 1, chair: true, max: {}, min: {} })
    addGroup({ name: "Tle SES", heuresHebdo: 6, quantity: 2, chair: true, max: { "Béné": 0 }, min: {} })
    addGroup({ name: "Tle EMC", heuresHebdo: 0.5, quantity: 5, chair: true, max: { "Stéphanie": 2, "Aurélie": 2, "Béné": 2 }, min: {} })
    addGroup({ name: "DGEMC", heuresHebdo: 3, quantity: 1, chair: true, max: { "Stéphanie": 0, "Béné": 0 }, min: {} }) // que Aurélie
    addGroup({ name: "Tle AP", heuresHebdo: 1, quantity: 2, chair: true, max: { "Stéphanie": 1, "Béné": 1, "Aurélie": 1 }, min: {} })
}

function drawPossibilities() {
    const groupList = service.getGroupList()
    const headers = groupList.map(group => group.name)
    const results = service.generateDistributions()
    const displayedQty = Math.min(20, results.length)
    const toDisplay = results.slice(0, displayedQty)
    document.getElementById("possibilities").innerHTML = toDisplay.map(possibility => {
        return `<table>
                    <tr>
                        <th>Prof</th>${headers.map(header => `<th>${header}</th>`).join("")}<th>Heures totales</th>
                    </tr>
                ${possibility.map(prof => (
            `<tr>
                            <td>${prof.name}</td>
                        ${headers.map(header => `<td>${prof.attribue[header]}</td>`).join("")}
                        <td>${prof.heures}</td>
                            </tr>`
        )).join("")}

                </table>`
    }).join("")
    console.info(results)
    document.getElementById("possibilityNumber").innerText = `(${results.length})`
}


function init() {
    drawProfList()
    drawGroupList()
    document.getElementById("fixturesBtn").addEventListener("click", fixtures)
    document.getElementById("generateBtn").addEventListener("click", drawPossibilities)
    document.getElementById("addProfBtn").addEventListener("click", addProf)
    document.getElementById("addGroupBtn").addEventListener("click", addGroup)

}
init()
