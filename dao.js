export const dao = {
    getProfList: () => localStorage.getItem("profList"),
    getGroupList: () => localStorage.getItem("groupList"),
    saveProfList: (profList) => localStorage.setItem("profList", profList),
    saveGroupList: (groupList) => localStorage.setItem("groupList", groupList),
}
