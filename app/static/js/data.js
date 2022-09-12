const COLOR_LIMIT_FREE = 0.3;
const COLOR_LIMIT_OCCUPIED = 0.1;

const eParkingEGColumn = document.getElementById('eparking-eg-column')
const eParkingEGValue = document.getElementById('eparking-eg')
const eParkingO1Column = document.getElementById('eparking-o1-column')
const eParkingO1Value = document.getElementById('eparking-o1')
const utilizationEGColumn = document.getElementById('utilization-column-eg')
const utilizationEGValue = document.getElementById('utilization-eg')
const utilizationO1Column = document.getElementById('utilization-column-o1')
const utilizationO1Value = document.getElementById('utilization-o1')
const utilizationO2Column = document.getElementById('utilization-column-o2')
const utilizationO2Value = document.getElementById('utilization-o2')
let eparkingErrors = 0;
let utilizationErrors = 0;

function getUtilization() {
    return getData("api?q=utilization");
}

function getUtilizationO() {
    return getData("api?q=o-utilization");
}

function getUtilizationO2() {
    return getData("api?q=o2-utilization");
}

function getEParkingEG() {
    return getData("api?q=eparking-eg");
}

function getEParkingO1() {
    return getData("api?q=eparking-o1");
}

function getData(url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

function removeColor(element) {
    element.classList.remove("occupied");
    element.classList.remove("full");
    element.classList.remove("free");
}

function applyColor(element, percentage) {
    if (percentage <= COLOR_LIMIT_OCCUPIED) {
        element.classList.add("full");
        element.classList.remove("free");
        element.classList.remove("occupied");
    } else if (percentage <= COLOR_LIMIT_FREE) {
        element.classList.add("occupied");
        element.classList.remove("free");
        element.classList.remove("full");
    } else {
        element.classList.add("free");
        element.classList.remove("occupied");
        element.classList.remove("full");
    }
}

function showEntryExitOccupancy(utilizationResult, utilizationOResult, utilizationO2Result) {
    const utilizationData = utilizationResult['results'][0]['data'][0];
    const utilizationOData = utilizationOResult['results'][0]['data'][0];
    const utilizationO2Data = utilizationO2Result['results'][0]['data'][0];

    const capacity = utilizationData['ParkingUtilization.capacity'];
    let occupied = utilizationData['ParkingUtilization.occupied'];
    occupied = Math.min(Math.max(occupied, 0), capacity)

    const capacityO = utilizationOData['ParkingUtilization.capacity'];
    let occupiedO = utilizationOData['ParkingUtilization.occupied'];
    occupiedO = Math.min(Math.max(occupiedO, 0), capacityO)

    const capacityO2 = utilizationO2Data['ParkingUtilization.capacity'];
    let occupiedO2 = utilizationO2Data['ParkingUtilization.occupied'];
    occupiedO2 = Math.min(Math.max(occupiedO2, 0), capacityO2)

    // occupied is the total occupacy, occupiedO is for OG1 + OG2, we need to subtract to get EG + OG1 values
    capacityO1 = capacityO - capacityO2;
    occupiedO1 = occupiedO - occupiedO2;
    occupiedO1 = Math.min(Math.max(occupiedO1, 0), capacityO1)

    capacityEG = capacity - capacityO;
    occupiedEG = occupied - occupiedO;
    occupiedEG = Math.min(Math.max(occupiedEG, 0), capacityEG)

    utilizationEG = occupiedEG / capacityEG;
    utilizationO1 = occupiedO1 / capacityO1;
    utilizationO2 = occupiedO2 / capacityO2;
    freeEG = 1 - utilizationEG
    freeO1 = 1 - utilizationO1
    freeO2 = 1 - utilizationO2

    freeEGRounded = Math.round(freeEG * 100 / 5) * 5
    freeO1Rounded = Math.round(freeO1 * 100 / 5) * 5
    freeO2Rounded = Math.round(freeO2 * 100 / 5) * 5

    applyColor(utilizationEGColumn, freeEGRounded / 100);
    applyColor(utilizationO1Column, freeO1Rounded / 100);
    applyColor(utilizationO2Column, freeO2Rounded / 100);
    utilizationEGValue.innerHTML = `<p>${freeEGRounded} %</p>`;
    utilizationO1Value.innerHTML = `<p>${freeO1Rounded} %</p>`;
    utilizationO2Value.innerHTML = `<p>${freeO2Rounded} %</p>`;

    console.debug(`occupied EG: ${occupiedEG}\noccupied OG1: ${occupiedO1}\noccupied OG2: ${occupiedO2}\n`)
}

function showEParkingOccupancy(eParkingResult, eParkingColumn, eParkingValue) {
    const eparkingData = eParkingResult['results'][0]['data'][0];
    const eparkingCapacity = eparkingData['SpacebasedParkingUtilization.capacity'];
    let eparkingOccupied = eparkingData['SpacebasedParkingUtilization.occupied'];

    eparkingOccupied = Math.min(Math.max(eparkingOccupied, 0), eparkingCapacity)
    eparkingFree = eparkingCapacity - eparkingOccupied
    applyColor(eParkingColumn, eparkingFree / eparkingCapacity);
    eParkingValue.innerHTML = `<p>${eparkingFree} / ${eparkingCapacity}</p>`;
}

function displayData() {
    getEParkingEG().then((result) => {
        showEParkingOccupancy(result, eParkingEGColumn, eParkingEGValue);
        eparkingErrors = 0;
    }).catch(() => {
        if (eparkingErrors > 20) {
            eParkingEGValue.innerHTML = `<p>offline</p>`;
            eParkingO1Value.innerHTML = `<p>offline</p>`;
            removeColor(eParkingColumn);
        } else {
            eparkingErrors += 1
        }
    });

    getEParkingO1().then((result) => {
        showEParkingOccupancy(result, eParkingO1Column, eParkingO1Value);
        eparkingErrors = 0;
    }).catch(() => {
        if (eparkingErrors > 20) {
            eParkingEGValue.innerHTML = `<p>offline</p>`;
            eParkingO1Value.innerHTML = `<p>offline</p>`;
            removeColor(eParkingEGColumn);
            removeColor(eParkingO1Column);
        } else {
            eparkingErrors += 1
        }
    });

    Promise.all([getUtilization(), getUtilizationO(), getUtilizationO2()]).then((results) => {
        showEntryExitOccupancy(results[0], results[1], results[2]);
        utilizationErrors = 0;
    }).catch(() => {
        if (utilizationErrors > 10) {
            utilizationEGValue.innerHTML = `<p>offline</p>`;
            utilizationO1Value.innerHTML = `<p>offline</p>`;
            utilizationO2Value.innerHTML = `<p>offline</p>`;
            removeColor(utilizationEGColumn);
            removeColor(utilizationO1Column);
            removeColor(utilizationO2Column);
        } else {
            utilizationErrors += 1;
        }
    });
}

// initial load
displayData();

// refresh data every 10 seconds
setInterval(function () {
    displayData();
}, 10000);
