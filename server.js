// run http://127.0.0.1:5500/
const Port = process.env.PORT || 5500;
const XMLHttpRequest = require('xhr2');
const http = require('http');
const path = require('path');
const express = require('express');
const app = express();
const server = http.Server(app);
const HTMLParser = require('node-html-parser');
const fs = require('fs').promises;

app.use(express.static(__dirname));

app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(Port, () => {
    //getData();
    console.log(`Server listening on port ${Port}`);
});

app.get('/rasp', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/rasp', async (req, res) => {
    console.log(`Call api: ${req.url.replace('/api', '')}`);
    const url = `https://ssau.ru${req.url.replace('/api', '')}`;
    const data = await fetchData(url);
    res.send(analyzeData(data));
});

async function fetchData(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.send(null);
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                resolve(HTMLParser.parse(request.responseText));
            }
        };
    });
}

function analyzeData(data) {
    let schedule = {
        dates: [],
        dayOfSchedule: [],
        Times: [],
        currentWeek: 17,
        color: [],
        currentGroup: ""
    };

    if (data.querySelector(".week-nav-current_week") !== null) {
        schedule.currentWeek = parseInt(data.querySelector(".week-nav-current_week").innerText);
    }

    if (data.querySelector(".info-block__title") !== null) {
        schedule.currentGroup = data.querySelector(".info-block__title").innerText;
    }

    console.log(schedule.currentWeek);

    for (let cell of data.querySelectorAll(".schedule__time")) {
        schedule.Times.push(cell.innerText);
    }

    for (let cell of data.querySelectorAll(".schedule__item")) {
        if (cell.querySelector(".schedule__head-weekday")) {
            schedule.dates.push(cell.innerText.trim());
        } else {
            if (cell.querySelector(".schedule__lesson")) {
                let subject = cell.querySelector(".schedule__discipline").innerText.trim();

                if (cell.querySelector(".lesson-color-type-1")) {
                    schedule.color.push("#43A047");
                } else if (cell.querySelector(".lesson-color-type-2")) {
                    schedule.color.push("#443FA2");
                } else if (cell.querySelector(".lesson-color-type-3")) {
                    schedule.color.push("#FF3D00");
                } else if (cell.querySelector(".lesson-color-type-4")) {
                    schedule.color.push("#F0AD4E");
                }

                let teacherElement = cell.querySelector(".schedule__teacher > .caption-text");
                let teacher;
                let place = cell.querySelector(".schedule__place").innerText.trim();

                if (teacherElement !== null) {
                    teacher = JSON.stringify({
                        "name": teacherElement.innerText.trim(),
                        "link": teacherElement.getAttribute("href")
                    });
                } else {
                    teacher = null;
                }

                let groupsElement = cell.querySelectorAll(".schedule__group");
                let groups = [];

                if (groupsElement !== null) {
                    for (let group of groupsElement) {
                        groupLink = group.getAttribute("href");
                        groupName = group.innerText.trim();
                        groups.push(JSON.stringify({
                            "name": groupName,
                            "link": groupLink
                        }));
                    }
                }

                schedule.dayOfSchedule.push({
                    "subject": subject,
                    "place": place,
                    "teacher": teacher,
                    "groups": groups
                });
            } else {
                schedule.dayOfSchedule.push({ "subject": null });
                schedule.color.push(null);
            }
        }
    }

    schedule.dayOfSchedule = schedule.dayOfSchedule.slice(1, schedule.dayOfSchedule.length);
    schedule.color = schedule.color.slice(1, schedule.color.length);

    return JSON.stringify(schedule);
}

app.get('/getData', async (req, res) => {
    await getData();
    res.sendFile(path.join(__dirname, 'data.json'));
});

async function getData() {
    const result = { groups: [], teachers: [] };
    const requests = [];

    for (let i = 1; i < 6; i++) {
        requests.push(fetchData(`https://ssau.ru/rasp/faculty/492430598?course=${i}`));
    }

    const responses = await Promise.all(requests);

    for (const response of responses) {
        const groups = response.querySelectorAll('.group-catalog__groups > a');
        for (const group of groups) {
            const id = group.getAttribute('href').replace(/\D/g, '');
            result.groups.push({ name: group.innerText, link: `/rasp?groupId=${id}` });
        }
    }

    const teacherRequests = [];

    for (let i = 1; i < 120; i++) {
        teacherRequests.push(fetchData(`https://ssau.ru/staff?page=${i}`));
    }

    const teacherResponses = await Promise.all(teacherRequests);

    for (const teacherResponse of teacherResponses) {
        const teachers = teacherResponse.querySelectorAll('.list-group-item > a');
        for (const teacher of teachers) {
            const id = teacher.getAttribute('href').replace(/\D/g, '');
            result.teachers.push({ name: teacher.innerText, link: `/rasp?staffId=${id}` });
        }
    }

    console.log('ok');
    await fs.writeFile('data.json', JSON.stringify(result));
}
