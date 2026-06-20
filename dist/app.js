(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/dao.js
  var dao;
  var init_dao = __esm({
    "src/dao.js"() {
      dao = {
        getProfList: () => JSON.parse(localStorage.getItem("profList")) ?? [],
        getGroupList: () => JSON.parse(localStorage.getItem("groupList")) ?? [],
        saveProfList: (profList) => localStorage.setItem("profList", JSON.stringify(profList)),
        saveGroupList: (groupList) => localStorage.setItem("groupList", JSON.stringify(groupList)),
        clear: () => localStorage.clear()
      };
    }
  });

  // src/service.js
  var service;
  var init_service = __esm({
    "src/service.js"() {
      init_dao();
      service = {
        clearMemory: function() {
          return dao.clear();
        },
        getProfList: function() {
          return dao.getProfList();
        },
        getGroupList: function() {
          return dao.getGroupList();
        },
        addProf: function(prof) {
          const profList = dao.getProfList();
          profList.push(prof);
          dao.saveProfList(profList);
        },
        removeProf: function(nameOfProfToRemove) {
          let profList = dao.getProfList();
          profList = profList.filter((prof) => prof.name !== nameOfProfToRemove);
          dao.saveProfList(profList);
        },
        addGroup: function(group) {
          const groupList = dao.getGroupList();
          groupList.push(group);
          dao.saveGroupList(groupList);
        },
        removeGroup: function(nameOfGroupToRemove) {
          let groupList = dao.getGroupList();
          groupList = groupList.filter((group) => group.name !== nameOfGroupToRemove);
          dao.saveGroupList(groupList);
        },
        groupUp: function(groupName) {
          let groupList = dao.getGroupList();
          const groupIndex = groupList.findIndex((group) => group.name === groupName);
          const newGroupList = [...groupList.slice(0, groupIndex - 1), groupList[groupIndex], groupList[groupIndex - 1], ...groupList.slice(groupIndex + 1)];
          dao.saveGroupList(newGroupList);
        },
        groupDown: function(groupName) {
          let groupList = dao.getGroupList();
          const groupIndex = groupList.findIndex((group) => group.name === groupName);
          const newGroupList = [...groupList.slice(0, groupIndex), groupList[groupIndex + 1], groupList[groupIndex], ...groupList.slice(groupIndex + 2)];
          dao.saveGroupList(newGroupList);
        },
        generateDistributions: function() {
          const service2 = this;
          const groupList = dao.getGroupList();
          const profList = dao.getProfList().map((prof) => ({
            ...prof,
            attribue: Object.fromEntries(
              groupList.filter((group) => group.min[prof.name]).map((group) => [group.name, group.min[prof.name]])
            )
          }));
          const results = [];
          function countGroupLeaves(group, profs) {
            const target = group.quantity;
            const n = profs.length;
            let dp = new Array(target + 1).fill(1);
            for (let i = n - 2; i >= 0; i--) {
              const minQ = group.min[profs[i].name] ?? 0;
              const maxQ = group.max[profs[i].name] ?? Infinity;
              const newDp = new Array(target + 1).fill(0);
              for (let r = 0; r <= target; r++) {
                let total = 0;
                for (let q = minQ; q <= Math.min(r, maxQ); q++) {
                  total += dp[r - q];
                }
                newDp[r] = total;
              }
              dp = newDp;
            }
            return dp[target];
          }
          const totalLeaves = groupList.reduce(
            (acc, group) => acc * countGroupLeaves(group, profList),
            1
          );
          let exploredLeaves = 0;
          function saveSolution(profs) {
            results.push(
              profs.map((prof) => ({
                ...prof,
                attribue: { ...prof.attribue },
                heures: service2._calculHeuresProf(prof)
              }))
            );
          }
          function backtrack(groupIndex = 0) {
            if (groupIndex === groupList.length) {
              exploredLeaves++;
              if (exploredLeaves % 1e3 === 0) {
                console.info(`${exploredLeaves.toLocaleString()} / ${totalLeaves.toLocaleString()} (${(100 * exploredLeaves / totalLeaves).toFixed(2)}%)`);
              }
              if (profList.every(
                (prof, i) => service2._calculHeuresProf(prof) >= Number(prof.quantity) && service2._calculHeuresProf(prof) <= Number(prof.max) && Object.entries(prof.attribue).every((entry) => (service2._getGroup(entry[0]).max[prof.name] === void 0 || entry[1] <= service2._getGroup(entry[0]).max[prof.name]) && (service2._getGroup(entry[0]).min[prof.name] === void 0 || entry[1] >= service2._getGroup(entry[0]).min[prof.name]))
              )) {
                saveSolution(profList);
              }
              return;
            }
            const group = groupList[groupIndex];
            function distribute(profIndex, remaining) {
              if (profIndex === profList.length - 1) {
                const qty = remaining;
                profList[profIndex].attribue[group.name] = qty;
                backtrack(groupIndex + 1);
                delete profList[profIndex].attribue[group.name];
                return;
              }
              for (let qty = group.min[profList[profIndex].name] ?? 0; qty <= remaining; qty++) {
                if (qty > group.max[profList[profIndex].name]) break;
                profList[profIndex].attribue[group.name] = qty;
                distribute(profIndex + 1, remaining - qty);
                delete profList[profIndex].attribue[group.name];
              }
            }
            distribute(0, group.quantity);
          }
          console.info(`Total th\xE9orique : ${totalLeaves.toLocaleString()}`);
          backtrack();
          console.info("Backtrack termin\xE9");
          console.info(`Solutions trouv\xE9es : ${results.length}`);
          return results;
        },
        _calculHeuresProf: function(prof) {
          return Object.entries(prof.attribue).reduce((prev, cur) => ["_", prev[1] + this._getGroupHours(this._getGroup(cur[0]), cur[1])], ["_", 0])[1] + this._getHeureChair(prof);
        },
        _getGroupHours: function(group, quantity) {
          return quantity * group.heuresHebdo;
        },
        _getGroup: function(groupName) {
          const groupList = dao.getGroupList();
          const group = groupList.filter((group2) => group2.name === groupName).pop();
          return group;
        },
        _getProf: function(profName) {
          const profList = dao.getProfList();
          const prof = profList.filter((prof2) => prof2.name === profName).pop();
          return prof;
        },
        _getHeureChair: function(prof) {
          return Math.min(
            1,
            Object.entries(prof.attribue).filter((entry) => this._getGroup(entry[0]).chair).reduce((prev, cur) => ["_", prev[1] + this._getGroupHours(this._getGroup(cur[0]), cur[1]) * 0.1], ["_", 0])[1]
          );
        }
      };
    }
  });

  // src/controller.js
  var require_controller = __commonJS({
    "src/controller.js"() {
      init_service();
      function drawProfList() {
        const profList = service.getProfList();
        const profListTable = document.getElementById("profList");
        const innerHTML = "<tr><th>Nom</th><th>Min</th><th>Max</th><th>Supprimer</th></tr>" + profList.map((prof) => `<tr><td>${prof.name}</td><td>${prof.quantity}</td><td>${prof.max}</td><td><button id="${prof.name}RemoveBtn">Supprimer</button></td></tr>`).join("");
        profListTable.innerHTML = innerHTML;
        profList.forEach((prof) => document.getElementById(`${prof.name}RemoveBtn`).addEventListener("click", () => removeProf(prof.name)));
        document.querySelectorAll("input[name*=_max], input[name*=_min]").forEach((element) => element.parentElement.removeChild(element));
        profList.forEach((prof) => _addProfMinMaxInputs(prof));
      }
      function drawGroupList() {
        const groupList = service.getGroupList();
        const groupListTable = document.getElementById("groupList");
        const innerHTML = `<tr><th>Nom</th><th>Heures Hebdo</th><th>Quantit\xE9</th>${service.getProfList().map((prof) => `<th>${prof.name} min</th><th>${prof.name} max</th>`).join("")}<th>Supprimer</th><th>Haut</th><th>Bas</th></tr>` + groupList.map((group) => `<tr><td>${group.name}</td><td>${group.heuresHebdo}</td><td>${group.quantity}</td>${service.getProfList().map((prof) => `<td>${group.min[prof.name] ?? ""}</td><td>${group.max[prof.name] ?? ""}</td>`).join("")}<td><button id="${group.name}RemoveBtn">Supprimer</button></td><td><button id="${group.name}UpBtn">Haut</button></td><td><button id="${group.name}DownBtn">Bas</button></td></tr>`).join("");
        groupListTable.innerHTML = innerHTML;
        groupList.forEach((group) => document.getElementById(`${group.name}RemoveBtn`).addEventListener("click", () => removeGroup(group.name)));
        groupList.forEach((group) => document.getElementById(`${group.name}UpBtn`).addEventListener("click", () => groupUp(group.name)));
        groupList.forEach((group) => document.getElementById(`${group.name}DownBtn`).addEventListener("click", () => groupDown(group.name)));
      }
      function groupUp(groupName) {
        service.groupUp(groupName);
        drawGroupList();
      }
      function groupDown(groupName) {
        service.groupDown(groupName);
      }
      function _getValue(id) {
        const input = document.getElementById(id);
        const value = input.value;
        input.value = null;
        return value;
      }
      function addProf(prof = void 0) {
        const newProf = prof.quantity ? prof : { name: _getValue("newProfName"), quantity: _getValue("newProfQuantity"), max: _getValue("newProfMax") };
        service.addProf(newProf);
        drawProfList();
      }
      function removeProf(nameOfProfToRemove) {
        service.removeProf(nameOfProfToRemove);
        drawProfList();
      }
      function addGroup(group = void 0) {
        const form = document.getElementById("groupForm");
        const data = Array.from(new FormData(form).entries());
        const max = Object.fromEntries(data.filter((entry) => entry[0].match(/_max/)).map((entry) => [entry[0].split("_max").shift(), Number.parseFloat(entry[1])]));
        const min = Object.fromEntries(data.filter((entry) => entry[0].match(/_min/)).map((entry) => [entry[0].split("_min").shift(), Number.parseFloat(entry[1])]));
        const newGroup = group.heuresHebdo ? group : { name: _getValue("newGroupName"), heuresHebdo: _getValue("newGroupHeuresHebdo"), quantity: _getValue("newGroupQuantity"), chair: _getValue("newGroupChair") === 1 ? true : false, min, max };
        service.addGroup(newGroup);
        drawGroupList();
      }
      function removeGroup(nameOfGroupToRemove) {
        service.removeGroup(nameOfGroupToRemove);
        drawGroupList();
      }
      function _addProfMinMaxInputs(prof) {
        const form = document.getElementById("groupForm");
        const boundary = document.getElementById("profMinMaxBoundary");
        for (const data of ["min", "max"]) {
          const element = document.createElement("input");
          element.type = "number";
          element.name = prof.name + "_" + data;
          element.placeholder = prof.name + " " + data;
          form.insertBefore(element, boundary);
        }
      }
      function fixtures() {
        service.clearMemory();
        addProf({ name: "St\xE9phanie", quantity: 18, max: 23 });
        addProf({ name: "B\xE9n\xE9", quantity: 6, max: 6.3 });
        addProf({ name: "Aur\xE9lie", quantity: 18, max: 23 });
        addGroup({ name: "2nd SES", heuresHebdo: 1.5, quantity: 6, chair: false, max: { "St\xE9phanie": 3, "Aur\xE9lie": 3, "B\xE9n\xE9": 3 }, min: { "Aur\xE9lie": 1, "St\xE9phanie": 2 } });
        addGroup({ name: "2nd AP", heuresHebdo: 1, quantity: 1, chair: false, max: { "St\xE9phanie": 0, "B\xE9n\xE9": 0 }, min: {} });
        addGroup({ name: "1re SES", heuresHebdo: 4, quantity: 3, chair: true, max: { "St\xE9phanie": 1, "Aur\xE9lie": 2, "B\xE9n\xE9": 2 }, min: { "B\xE9n\xE9": 1 } });
        addGroup({ name: "1re EPPCS", heuresHebdo: 1, quantity: 1, chair: true, max: { "Aur\xE9lie": 0, "St\xE9phanie": 0 }, min: { "B\xE9n\xE9": 1 } });
        addGroup({ name: "1re AP", heuresHebdo: 1, quantity: 1, chair: true, max: {}, min: {} });
        addGroup({ name: "Tle SES", heuresHebdo: 6, quantity: 2, chair: true, max: { "B\xE9n\xE9": 0 }, min: {} });
        addGroup({ name: "Tle EMC", heuresHebdo: 0.5, quantity: 5, chair: true, max: { "St\xE9phanie": 2, "Aur\xE9lie": 2, "B\xE9n\xE9": 2 }, min: {} });
        addGroup({ name: "DGEMC", heuresHebdo: 3, quantity: 1, chair: true, max: { "St\xE9phanie": 0, "B\xE9n\xE9": 0 }, min: {} });
        addGroup({ name: "Tle AP", heuresHebdo: 1, quantity: 2, chair: true, max: { "St\xE9phanie": 1, "B\xE9n\xE9": 1, "Aur\xE9lie": 1 }, min: {} });
      }
      function drawPossibilities() {
        const groupList = service.getGroupList();
        const headers = groupList.map((group) => group.name);
        const results = service.generateDistributions();
        const displayedQty = Math.min(20, results.length);
        const toDisplay = results.slice(0, displayedQty);
        document.getElementById("possibilities").innerHTML = toDisplay.map((possibility) => {
          return `<table>
                    <tr>
                        <th>Prof</th>${headers.map((header) => `<th>${header}</th>`).join("")}<th>Heures totales</th>
                    </tr>
                ${possibility.map((prof) => `<tr>
                            <td>${prof.name}</td>
                        ${headers.map((header) => `<td>${prof.attribue[header]}</td>`).join("")}
                        <td>${prof.heures}</td>
                            </tr>`).join("")}

                </table>`;
        }).join("");
        console.info(results);
        document.getElementById("possibilityNumber").innerText = `(${results.length})`;
      }
      function init() {
        drawProfList();
        drawGroupList();
        document.getElementById("fixturesBtn").addEventListener("click", fixtures);
        document.getElementById("generateBtn").addEventListener("click", drawPossibilities);
        document.getElementById("addProfBtn").addEventListener("click", addProf);
        document.getElementById("addGroupBtn").addEventListener("click", addGroup);
      }
      init();
    }
  });
  require_controller();
})();
