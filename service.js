import { dao } from "dao.js"


export function getProfList() {
    return dao.getProfList()
}

export function getGroupList() {
    return dao.getGroupList()
}

export function setProfList(profList) {
    return dao.setProfList(profList)
}

export function setGroupList(groupList) {
    return dao.setGroupList(groupList)
}

export function generateDistributions() {
    const profList = dao.getProfList()
    const groupList = dao.getGroupList()
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
    const groupList = dao.getGroupList()
    const group = groupList.filter(group => group.name === groupName).pop()
    return group
}

function _getProf(profName) {
    const profList = dao.getProfList()
    const prof = profList.filter(prof => prof.name === profName).pop()
    return prof
}

function _getHeureChair(prof) {
    return Math.min(1,
        Object.entries(prof.attribue)
            .filter(entry => _getGroup(entry[0]).chair)
            .reduce((prev, cur) => ["_", prev[1] + _getGroupHours(_getGroup(cur[0]), cur[1]) * 0.1], ["_", 0])[1]
    )
}


