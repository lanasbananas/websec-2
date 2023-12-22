let currentUrl = window.location.href;
let urlWithoutDomain = currentUrl.replace(window.location.origin, '');
let urlParams = new URLSearchParams(urlWithoutDomain);
let currentWeek = parseInt(urlParams.get('selectedWeek')) || 1;
let currentGroup = "";

getAPI();

function getAPI() {
    let urlAPI = '/api' + urlWithoutDomain;
    fetch(urlAPI)
        .then(response => response.json())
        .then(data => {
            const btn = document.querySelector("#previousWeek");
            btn.style.visibility = data.currentWeek === 1 ? 'hidden' : 'visible';
            getSchedule(data);
        })
        .catch(err => console.log(err));
}

function getSchedule(data) {
    currentWeek = parseInt(data.currentWeek);
    currentGroup = data.currentGroup;

    let label = document.getElementById('currentWeek');
    let currentGroupLabel = document.getElementById('currentGroup');
    currentGroupLabel.innerHTML = currentGroup;
    label.innerHTML = "Неделя " + currentWeek;

    let table = document.querySelector("#schedule");
    table.innerHTML = ""; 

    let firstRow = table.insertRow();
    addCell(firstRow, "Время", 70);

    for (let date of data.dates) {
        let parts = date.split(" ");
        addCell(firstRow, parts[0] + "<br>" + parts[1], 220);
    }

    for (let i = 0; i < data.Times.length; i++) {
        let row = table.insertRow();
        row.style.maxHeight = "60px";
        addCell(row, data.Times[i], 70);

        for (let j = 0; j < data.dates.length; j++) {
            let cell = row.insertCell();
            let day = data.dayOfSchedule[6 * i + j];

            if (day.subject != null) {
                let subject = document.createElement("h4");
                subject.textContent = day.subject;
                subject.style.color = data.color[6 * i + j];
                cell.appendChild(subject);
                cell.appendChild(document.createTextNode(day.place));

                for (let g of day.groups) {
                    let group = document.createElement('a');
                    group.textContent = JSON.parse(g).name;
                    group.href = JSON.parse(g).link;
                    cell.appendChild(group);
                    cell.appendChild(document.createElement("br"));
                }

                if (day.teacher != null) {
                    let t = JSON.parse(day.teacher);
                    let teacher = document.createElement('a');
                    teacher.textContent = t.name;
                    teacher.href = t.link;
                    cell.appendChild(teacher);
                    cell.appendChild(document.createElement("br"));
                }

                cell.appendChild(document.createElement("br"));
            }
        }
    }
}

function addCell(row, content, width) {
    let cell = row.insertCell();
    cell.style.width = width + "px";
    cell.innerHTML = content;
}

function previousWeek() {
    if (currentWeek > 1) {
        updateWeek(currentWeek - 1);
    }
}

function nextWeek() {
    if (currentWeek < 18) {
        updateWeek(currentWeek + 1);
    }
}

function updateWeek(week) {
    currentWeek = week;
    let query = urlWithoutDomain.split('?')[1];
    let urlParams = new URLSearchParams(query);
    urlParams.set('selectedWeek', currentWeek);
    urlWithoutDomain = '/rasp?' + urlParams.toString();
    location.assign(urlWithoutDomain);
}

function loadNewUrl() {
    getAPI();
    location.assign(urlWithoutDomain);
}

fetch('/getData')
    .then(response => response.json())
    .then(data => {
        let groups = document.getElementById("selectString");

        for (let group of data.groups) {
            addOption(groups, group.name);
        }

        for (let teacher of data.teachers) {
            addOption(groups, teacher.name);
        }

        let input = document.getElementById('inputTextGroup');

        input.addEventListener('change', (event) => {
            for (let group of data.groups) {
                if (group.name.trim() == input.value.trim()) {
                    urlWithoutDomain = group.link;
                    loadNewUrl();
                    break;
                }
            }
            for (let teacher of data.teachers) {
                if (teacher.name.trim() == input.value.trim()) {
                    urlWithoutDomain = teacher.link;
                    loadNewUrl();
                    break;
                }
            }
        });
    });

function addOption(selectElement, value) {
    let option = document.createElement('option');
    option.setAttribute('value', value);
    selectElement.appendChild(option);
}
