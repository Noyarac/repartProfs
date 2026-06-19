export const dao = {
    getProfList: () => JSON.parse(localStorage.getItem("profList")) ?? [],
    getGroupList: () => JSON.parse(localStorage.getItem("groupList")) ?? [],
    saveProfList: (profList) => localStorage.setItem("profList", JSON.stringify(profList)),
    saveGroupList: (groupList) => localStorage.setItem("groupList", JSON.stringify(groupList)),
    clear: () => localStorage.clear()
}
