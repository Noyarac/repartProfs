let profList = []
let groupList = []
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
    const headers = groupList.map(group => group.name)
    const results = generateDistributions()
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
                        <td>${_calculHeuresProf(prof)}</td>
                            </tr>`
        )).join("")}

                </table>`
    }).join("")
    console.info(results)
    document.getElementById("possibilityNumber").innerText = `(${results.length})`
}

function generateDistributions() {
    const progress = document.getElementById("progress")
    const results = []
    let exploredLeaves = 0
    const profs = profList.map(prof => ({
        ...prof,
        attribue: {}
    }))

    const currentHours = profs.map(() => 0)

    const totalLeaves = groupList.reduce(
        (acc, group) =>
            acc * combination(
                group.quantity + profList.length - 1,
                profList.length - 1
            ),
        1
    )

    function combination(n, k) {
        let result = 1
        for (let i = 1; i <= k; i++) {
            result *= (n - k + i)
            result /= i
        }
        return result
    }

    function saveSolution() {
        results.push(
            profs.map(prof => ({
                ...prof,
                attribue: { ...prof.attribue }
            }))
        );
    }

    function backtrack(groupIndex = 0) {
        if (groupIndex === groupList.length) {
            exploredLeaves++
            if (exploredLeaves % 100000 === 0) {
                console.info(`${exploredLeaves.toLocaleString()} / ${totalLeaves.toLocaleString()} (${(100 * exploredLeaves / totalLeaves).toFixed(2)}%)`)
            } if (
                profs.every(
                    (prof, i) => (currentHours[i] + _getHeureChair(prof) >= Number(prof.quantity))
                        && (currentHours[i] + _getHeureChair(prof) <= Number(prof.max))
                        && Object.entries(prof.attribue)
                            .every(entry => (
                                (_getGroup(entry[0]).max[prof.name] === undefined || entry[1] <= _getGroup(entry[0]).max[prof.name])
                                && (_getGroup(entry[0]).min[prof.name] === undefined || entry[1] >= _getGroup(entry[0]).min[prof.name])
                            ))
                )
            ) {
                saveSolution()
            }
            return
        }
        const group = groupList[groupIndex]

        function distribute(profIndex, remaining) {
            if (profIndex === profs.length - 1) {
                const qty = remaining
                profs[profIndex].attribue[group.name] = qty
                currentHours[profIndex] += _getGroupHours(group, qty)
                backtrack(groupIndex + 1)
                currentHours[profIndex] -= _getGroupHours(group, qty)
                delete profs[profIndex].attribue[group.name]
                return
            }

            for (let qty = 0; qty <= remaining; qty++) {
                profs[profIndex].attribue[group.name] = qty
                currentHours[profIndex] += _getGroupHours(group, qty)
                distribute(profIndex + 1, remaining - qty)
                currentHours[profIndex] -= _getGroupHours(group, qty)
                delete profs[profIndex].attribue[group.name]
            }
        }
        distribute(0, group.quantity)
    }

    console.info(`Total théorique : ${totalLeaves.toLocaleString()}`)

    progress.style.display = "block"
    backtrack()
    progress.style.display = "none"
    console.info("Backtrack terminé")
    console.info(`Solutions trouvées : ${results.length}`)
    return results
}

function _calculHeuresProf(prof) {
    return Object.entries(prof.attribue)
        .reduce((prev, cur) => ["_", prev[1] + _getGroupHours(_getGroup(cur[0]), cur[1])], ["_", 0])[1] + _getHeureChair(prof)
}

function _getGroupHours(group, quantity) {
    return quantity * group.heuresHebdo
}

function _getGroup(groupName) {
    const group = groupList.filter(group => group.name === groupName).pop()
    return group
}

// function _getProf(profName) {
//     const prof = profList.filter(prof => prof.name === profName).pop()
//     return prof
// }

function _getHeureChair(prof) {
    return Math.min(1,
        Object.entries(prof.attribue)
            .filter(entry => _getGroup(entry[0]).chair)
            .reduce((prev, cur) => ["_", prev[1] + _getGroupHours(_getGroup(cur[0]), cur[1]) * 0.1], ["_", 0])[1]
    )
}


