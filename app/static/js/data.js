const COLOR_LIMIT_FREE = 0.3;
const COLOR_LIMIT_OCCUPIED = 0.1;

const eParkingColumn = document.getElementById('eparking-column')
const eParkingValue = document.getElementById('eparking')
const utilizationU1Column = document.getElementById('utilization-column-ug1')
const utilizationU1Value = document.getElementById('utilization-ug1')
const utilizationU2Column = document.getElementById('utilization-column-ug2')
const utilizationU2Value = document.getElementById('utilization-ug2')
let eparkingErrors = 0;
let utilizationErrors = 0;

function getUtilization() {
    return getData("api?q=utilization");
}

function getUtilizationU2() {
    return getData("api?q=u2-utilization");
}

function getEParking() {
    return getData("api?q=eparking");
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

function showEntryExitOccupancy(utilizationResult, utilizationU2Result) {
    const utilizationData = utilizationResult['results'][0]['data'][0];
    const utilizationU2Data = utilizationU2Result['results'][0]['data'][0];

    const capacity = Number(utilizationData['ParkingUtilization.capacity']);
    let occupied = Number(utilizationData['ParkingUtilization.occupied']);
    occupied = Math.min(Math.max(occupied, 0), capacity)

    const capacityU2 = Number(utilizationU2Data['ParkingUtilization.capacity']);
    let occupiedU2 = Number(utilizationU2Data['ParkingUtilization.occupied']);
    occupiedU2 = Math.min(Math.max(occupiedU2, 0), capacityU2)

    // occupied is the total occupacy, we need to subtract the occupied by U2
    const capacityU1 = capacity - capacityU2;
    let occupiedU1 = occupied - occupiedU2;
    occupiedU1 = Math.min(Math.max(occupiedU1, 0), capacity - capacityU2)

    const utilizationU1 = occupiedU1 / capacityU1;
    const utilizationU2 = occupiedU2 / capacityU2;
    const freeU1 = 1 - utilizationU1
    const freeU2 = 1 - utilizationU2

    const freeU1Rounded = Math.round(freeU1 * 100 / 5) * 5
    const freeU2Rounded = Math.round(freeU2 * 100 / 5) * 5

    applyColor(utilizationU1Column, freeU1);
    applyColor(utilizationU2Column, freeU2);
    utilizationU1Value.innerHTML = `<p>${freeU1Rounded} %</p>`;
    utilizationU2Value.innerHTML = `<p>${freeU2Rounded} %</p>`;

    console.debug(`occupied U1: ${occupiedU1}\noccupied U2: ${occupiedU2}\n`)
}

function showEParkingOccupancy(eParkingResult) {
    const eparkingData = eParkingResult['results'][0]['data'][0];
    const eparkingCapacity = Number(eparkingData['SpacebasedParkingUtilization.capacity']);
    let eparkingOccupied = Number(eparkingData['SpacebasedParkingUtilization.occupied']);

    eparkingOccupied = Math.min(Math.max(eparkingOccupied, 0), eparkingCapacity)
    const eparkingFree = eparkingCapacity - eparkingOccupied
    applyColor(eParkingColumn, eparkingFree / eparkingCapacity);
    eParkingValue.innerHTML = `<p>${eparkingFree} / ${eparkingCapacity}</p>`;
}

function displayData() {
    let utilizationResult;

    getEParking()
        .then((result) => {
            showEParkingOccupancy(result);
            eparkingErrors = 0;
            return getUtilization(); // Chain getUtilization after getEParking
        })
        .catch((eparkingError) => {
            // Handle errors from getEParking here
            console.error("Error in getEParking:", eparkingError);
            if (eparkingErrors > 2) {
                eParkingValue.innerHTML = `<p>offline</p>`;
                removeColor(eParkingColumn);
            } else {
                eparkingErrors += 1;
            }
            // Still chain getUtilization after getEParking failed
            return getUtilization();
        })
        .then((utilizationResultFromGetUtilization) => {
                utilizationResult = utilizationResultFromGetUtilization;
                return getUtilizationU2(); // Chain getUtilizationU2 after getUtilization
        })
        .then((utilizationU2Result) => {
            showEntryExitOccupancy(utilizationResult, utilizationU2Result);
            utilizationErrors = 0;
        })
        .catch((utilizationError) => {
            // Handle errors from getUtilization or getUtilizationU2 here
            console.error("Error in getUtilization or getUtilizationU2:", utilizationError);
            if (utilizationErrors > 2) {
                utilizationU1Value.innerHTML = `<p>offline</p>`;
                utilizationU2Value.innerHTML = `<p>offline</p>`;
                removeColor(utilizationU1Column);
                removeColor(utilizationU2Column);
            } else {
                utilizationErrors += 1;
            }
        });
}



// initial load
displayData();

// refresh data every 120 seconds
setInterval(function () {
    displayData();
}, 120000);
