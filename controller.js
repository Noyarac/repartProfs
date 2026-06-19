import { service } from "./service.js"

function drawProfList() {
    const profList = service.getProfList()
    const profListTable = document.getElementById("profList")
    const innerHTML = "<tr><th>Nom</th><th>Heures</th></tr>" + profList.map(prof => `<tr><td>${prof.name}</td><td>${prof.quantity}</td><td><button onclick="removeProf('${prof.name}')">Supprimer</button></td></tr>`).join("")
    profListTable.innerHTML = innerHTML
}

function drawGroupList() {
    const groupList = service.getGroupList()
    const groupListTable = document.getElementById("groupList")
    const innerHTML = "<tr><th>Nom</th><th>Heures Hebdo</th><th>Quantité</th></tr>" + groupList.map(group => `<tr><td>${group.name}</td><td>${group.heuresHebdo}</td><td>${group.quantity}</td><td><button onclick="removeGroup('${group.name}')">Supprimer</button></td></tr>`).join("")
    groupListTable.innerHTML = innerHTML
}

function _getValue(id) {
    const input = document.getElementById(id)
    const value = input.value
    input.value = null
    return value
}

function addProf(prof = undefined) {
    const newProf = prof ?? { name: _getValue("newProfName"), quantity: _getValue("newProfQuantity") }
    service.addProf(newProf)
    drawProfList()
}

function removeProf(nameOfProfToRemove) {
    service.removeProf(nameOfProfToRemove)
    drawProfList()
}

function addGroup(group = undefined) {
    const newGroup = group ?? { name: _getValue("newGroupName"), heuresHebdo: _getValue("newGroupHeuresHebdo"), quantity: _getValue("newGroupQuantity"), chair: _getValue("newGroupChair") === 1 ? true : false }
    service.addGroup(newGroup)
    drawGroupList()
}

function removeGroup(nameOfGroupToRemove) {
    service.removeGroup(nameOfGroupToRemove)
    drawGroupList()
}

function fixtures() {
    service.clearMemory()
    addProf({ name: "Stéphanie", quantity: 18, max: 23 })
    addProf({ name: "Béné", quantity: 6, max: 6.3 })
    addProf({ name: "Aurélie", quantity: 18, max: 23 })
    addGroup({ name: "2nd SES", heuresHebdo: 1.5, quantity: 6, chair: false, max: { "Stéphanie": 3, "Aurélie": 3, "Béné": 3 }, min: { "Aurélie": 1, "Stéphanie": 2 } }) // Aurélie min 1
    addGroup({ name: "2nd AP", heuresHebdo: 1, quantity: 1, chair: false, max: { "Stéphanie": 0, "Béné": 0 }, min: {} }) // que Aurélie
    addGroup({ name: "1re SES", heuresHebdo: 4, quantity: 3, chair: true, max: { "Stéphanie": 1, "Aurélie": 2, "Béné": 2 }, min: {} })
    addGroup({ name: "1re EPPCS", heuresHebdo: 1, quantity: 1, chair: true, max: { "Aurélie": 0, "Stéphanie": 0 }, min: {} }) // que Béné
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

}
init()
