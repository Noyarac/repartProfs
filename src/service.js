import { dao } from "./dao.js"

export const service = {
    clearMemory: function () {
        return dao.clear()
    },

    getProfList: function () {
        return dao.getProfList()
    },

    getGroupList: function () {
        return dao.getGroupList()
    },

    addProf: function (prof) {
        const profList = dao.getProfList()
        profList.push(prof)
        dao.saveProfList(profList)
    },

    removeProf: function (nameOfProfToRemove) {
        let profList = dao.getProfList()
        profList = profList.filter(prof => prof.name !== nameOfProfToRemove)
        dao.saveProfList(profList)
    },

    addGroup: function (group) {
        const groupList = dao.getGroupList()
        groupList.push(group)
        dao.saveGroupList(groupList)
    },

    removeGroup: function (nameOfGroupToRemove) {
        let groupList = dao.getGroupList()
        groupList = groupList.filter(group => group.name !== nameOfGroupToRemove)
        dao.saveGroupList(groupList)
    },

    groupUp: function (groupName) {
        let groupList = dao.getGroupList()
        const groupIndex = groupList.findIndex(group => group.name === groupName)
        const newGroupList = [...groupList.slice(0,groupIndex - 1), groupList[groupIndex], groupList[groupIndex - 1], ...groupList.slice(groupIndex + 1)]
        dao.saveGroupList(newGroupList)
    },

    groupDown: function (groupName) {
        let groupList = dao.getGroupList()
        const groupIndex = groupList.findIndex(group => group.name === groupName)
        const newGroupList = [...groupList.slice(0,groupIndex), groupList[groupIndex + 1], groupList[groupIndex], ...groupList.slice(groupIndex + 2)]
        dao.saveGroupList(newGroupList)
    },

    generateDistributions: function () {
        const service = this
        const groupList = dao.getGroupList()
        const profList = dao.getProfList().map(prof => ({
            ...prof,
            attribue: Object.fromEntries(
                groupList
                    .filter(group => group.min[prof.name])
                    .map(group => [group.name, group.min[prof.name]])
            )
        }))

        const results = []

        function countGroupLeaves(group, profs) {
            const target = group.quantity
            const n = profs.length
            let dp = new Array(target + 1).fill(1)
            for (let i = n - 2; i >= 0; i--) {
                const minQ = group.min[profs[i].name] ?? 0
                const maxQ = group.max[profs[i].name] ?? Infinity
                const newDp = new Array(target + 1).fill(0)
                for (let r = 0; r <= target; r++) {
                    let total = 0
                    for (let q = minQ; q <= Math.min(r, maxQ); q++) {
                        total += dp[r - q]
                    }
                    newDp[r] = total
                }
                dp = newDp
            }
            return dp[target]
        }

        const totalLeaves = groupList.reduce(
            (acc, group) => acc * countGroupLeaves(group, profList),
            1
        )
        let exploredLeaves = 0

        function saveSolution(profs) {
            results.push(
                profs.map(prof => ({
                    ...prof,
                    attribue: { ...prof.attribue },
                    heures: service._calculHeuresProf(prof)
                }))
            )
        }

        function backtrack(groupIndex = 0) {
            if (groupIndex === groupList.length) {
                exploredLeaves++
                if (exploredLeaves % 1000 === 0) {
                    console.info(`${exploredLeaves.toLocaleString()} / ${totalLeaves.toLocaleString()} (${(100 * exploredLeaves / totalLeaves).toFixed(2)}%)`)
                } if (
                    profList.every(
                        (prof, i) => (service._calculHeuresProf(prof) >= Number(prof.quantity))
                            && (service._calculHeuresProf(prof) <= Number(prof.max))
                            && Object.entries(prof.attribue)
                                .every(entry => (
                                    (service._getGroup(entry[0]).max[prof.name] === undefined || entry[1] <= service._getGroup(entry[0]).max[prof.name])
                                    && (service._getGroup(entry[0]).min[prof.name] === undefined || entry[1] >= service._getGroup(entry[0]).min[prof.name])
                                ))
                    )
                ) {
                    saveSolution(profList)
                }
                return
            }
            const group = groupList[groupIndex]

            function distribute(profIndex, remaining) {
                if (profIndex === profList.length - 1) {
                    const qty = remaining
                    profList[profIndex].attribue[group.name] = qty
                    backtrack(groupIndex + 1)
                    delete profList[profIndex].attribue[group.name]
                    return
                }

                for (let qty = group.min[profList[profIndex].name] ?? 0; qty <= remaining; qty++) {
                    if (qty > group.max[profList[profIndex].name] ?? Infinity) break
                    profList[profIndex].attribue[group.name] = qty
                    distribute(profIndex + 1, remaining - qty)
                    delete profList[profIndex].attribue[group.name]
                }
            }
            distribute(0, group.quantity)
        }

        console.info(`Total théorique : ${totalLeaves.toLocaleString()}`)

        backtrack()
        console.info("Backtrack terminé")
        console.info(`Solutions trouvées : ${results.length}`)
        return results
    },

    _calculHeuresProf: function(prof) {
        return Object.entries(prof.attribue)
            .reduce((prev, cur) => ["_", prev[1] + this._getGroupHours(this._getGroup(cur[0]), cur[1])], ["_", 0])[1] + this._getHeureChair(prof)
    },

    _getGroupHours: function (group, quantity) {
        return quantity * group.heuresHebdo
    },

    _getGroup: function (groupName) {
        const groupList = dao.getGroupList()
        const group = groupList.filter(group => group.name === groupName).pop()
        return group
    },

    _getProf: function (profName) {
        const profList = dao.getProfList()
        const prof = profList.filter(prof => prof.name === profName).pop()
        return prof
    },

    _getHeureChair: function (prof) {
        return Math.min(1,
            Object.entries(prof.attribue)
                .filter(entry => this._getGroup(entry[0]).chair)
                .reduce((prev, cur) => ["_", prev[1] + this._getGroupHours(this._getGroup(cur[0]), cur[1]) * 0.1], ["_", 0])[1]
        )
    },

}

