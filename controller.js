import { generateDistributions, calculHeuresProf, getProfList, getGroupList } from "service.js"

let profList = getProfList() ?? []
let groupList = getGroupList() ?? []
const getValue = id => {
    const input = document.getElementById(id)
    const value = input.value
    input.value = null
    return value
}

function addProf(prof = undefined) {
    let newProf = prof ?? { name: getValue("newProfName"), quantity: getValue("newProfQuantity"), attribue: {} }
    profList.push(newProf)
    drawProfList()
}

function removeProf(nameOfProfToRemove) {
    profList = profList.filter(prof => prof.name !== nameOfProfToRemove)
    drawProfList()
}

function drawProfList() {
    let profListTable = document.getElementById("profList")
    let innerHTML = profList.map(prof => `<tr><td>${prof.name}</td><td>${prof.quantity}</td><td><button onclick="removeProf('${prof.name}')">Supprimer</button></td></tr>`).join("")
    profListTable.innerHTML = "<tr><th>Nom</th><th>Heures</th></tr>" + innerHTML
}

function addGroup(group = undefined) {
    let newGroup = group ?? { name: getValue("newGroupName"), heuresHebdo: getValue("newGroupHeuresHebdo"), quantity: getValue("newGroupQuantity"), chair: getValue("newGroupChair") === 1 ? true : false }
    groupList.push(newGroup)
    drawGroupList()
}

function removeGroup(nameOfGroupToRemove) {
    groupList = groupList.filter(group => group.name !== nameOfGroupToRemove)
    drawGroupList()
}

function drawGroupList() {
    let groupListTable = document.getElementById("groupList")
    let innerHTML = groupList.map(group => `<tr><td>${group.name}</td><td>${group.heuresHebdo}</td><td>${group.quantity}</td><td><button onclick="removeGroup('${group.name}')">Supprimer</button></td></tr>`).join("")
    groupListTable.innerHTML = "<tr><th>Nom</th><th>Heures Hebdo</th><th>Quantité</th></tr>" + innerHTML
}

function fixtures() {
    addProf({ name: "Stéphanie", quantity: 18, max: 23, attribue: {} })
    addProf({ name: "Béné", quantity: 6, max: 6.3, attribue: {} })
    addProf({ name: "Aurélie", quantity: 18, max: 23, attribue: {} })
    addGroup({ name: "2nd SES", heuresHebdo: 1.5, quantity: 7, chair: false, max: { "Stéphanie": 3, "Aurélie": 3, "Béné": 3 }, min: { "Aurélie": 1, "Stéphanie": 2 } }) // Aurélie min 1
    addGroup({ name: "2nd AP", heuresHebdo: 1, quantity: 1, chair: false, max: { "Stéphanie": 0, "Béné": 0 }, min: {} }) // que Aurélie
    addGroup({ name: "1re SES", heuresHebdo: 4, quantity: 3, chair: true, max: { "Stéphanie": 1, "Aurélie": 2, "Béné": 2 }, min: {} })
    addGroup({ name: "1re EPPCS", heuresHebdo: 1, quantity: 1, chair: true, max: { "Aurélie": 0, "Stéphanie": 0 }, min: {} }) // que Béné
    addGroup({ name: "1re AP", heuresHebdo: 1, quantity: 1, chair: true, max: {}, min: {} })
    addGroup({ name: "Tle SES", heuresHebdo: 6, quantity: 2, chair: true, max: { "Béné": 0 }, min: {} })
    addGroup({ name: "Tle EMC", heuresHebdo: 0.5, quantity: 4, chair: true, max: { "Stéphanie": 2, "Aurélie": 2, "Béné": 2 }, min: {} })
    addGroup({ name: "C3 EMC", heuresHebdo: 0.5, quantity: 1, chair: true, max: {}, min: {} })
    addGroup({ name: "DGEMC", heuresHebdo: 3, quantity: 1, chair: true, max: { "Stéphanie": 0, "Béné": 0 }, min: {} }) // que Aurélie
    addGroup({ name: "Tle AP", heuresHebdo: 1, quantity: 2, chair: true, max: { "Stéphanie": 1, "Béné": 1, "Aurélie": 1 }, min: {} })
}

function drawPossibilities() {
    const headers = groupList.map(group => group.name)
    const results = generateDistributions()
    const toDisplay = Array(20).fill(null).map(result => results[Math.floor(Math.random() * results.length)])
    document.getElementById("possibilities").innerHTML = toDisplay.map(possibility => {
        return `<table>
                    <tr>
                        <th>Prof</th>${headers.map(header => `<th>${header}</th>`).join("")}<th>Heures totales</th>
                    </tr>
                    ${possibility.map(prof => (
            `<tr>
                            <td>${prof.name}</td>
                        ${headers.map(header => `<td>${prof.attribue[header]}</td>`).join("")}
                        <td>${calculHeuresProf(prof)}</td>
                            </tr>`
        )).join("")}

                </table>`
    }).join("")
    console.info(results)
    document.getElementById("possibilityNumber").innerText = `(${results.length})`
}
