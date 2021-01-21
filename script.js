var ul = document.getElementById("countries");
var modal = document.getElementById("modal");
var formModal = document.getElementById("formModal");
var infoBox = document.getElementById("infoBox");
var textPlaceholder = document.getElementById("textPlaceholder");

let nameIn = document.getElementById("nameInput");
let areaIn = document.getElementById("areaInput");
let populationIn = document.getElementById("populationInput");
let codeIn = document.getElementById("codeInput");

// Default values

const url = "https://akademija.teltonika.lt/api1/index.php/countries";
let countries = [];
let countryPages;
let currentPage = 1;
let start = 0;
let end = 10;
let toggledFilter = false;
let array;
let filterDate;
let type = "default";

const getData = async () => {
    countries = [];
    try {
        const response = await fetch(url, {
            method: "GET",
        });
        const data = await response.json();
        let pageCount = data.countires.length / 10;
        const pageCountRemainder = pageCount % 1;
        const pageCountRest = Math.floor(pageCount);
        if (pageCountRemainder > 0) pageCount = Number(pageCountRest) + 1;
        countryPages = Array(pageCount)
            .fill(1)
            .map((x, i) => i + 1);
        countries.push(...data.countires);
        array = data.countires;
        appendElements(array);
    } catch (err) {
        popInfo(err);
    }
};

// Sets page counters and populates pagination
// menu with back/forward and number buttons

// Ideally I would make it get about 6-7 pages worth of data
// and reduce the amount of data fetched to about 60-70 items
// and make pagination look something like this:
// < 1 ... 4 5 6 7 8 9 ... {last number} >
// and just fetch the data in the numbers that are displayed,
// leaving the rest of the pages in between the values unfetched.
// This would improve performance to both client and server as it
// would fetch less data
// However the api does not give any page count or any data about it
// So right now it fetches all the possible data from page 1
// (because thats how the api is set up)
// and paginates it all.

const paginate = () => {
    if (countryPages.length > 1) {
        pagingList = ``;
        index = 1;
        pagingList += `<button class="pageLink iconButton" onclick="previousPage()"><</button>`;
        countryPages.forEach(() => {
            if (index == currentPage)
                pagingList += `<button class="pageLink iconButton currentPage"">${index++}</button>`;
            else
                pagingList += `<button class="pageLink iconButton" onclick="gotoPage(${index})">${index++}</button>`;
        });
        pagingList += `<button class="pageLink iconButton" onclick="nextPage()">></button>`;
        document.getElementById("pagination").innerHTML = pagingList;
    }
};

// Repopulates the table with relevant data
// Takes into account whether:
// A filter is set
// A search has been performed
// A sort has been performed

const appendElements = (countryList) => {
    paginate();
    let html = `
                <tr class="tableHeader">
                    <th class="sortHeader">Pavadinimas
                        <button id="sort" class="iconButton" onclick="sort()">
                            <i class="fas fa-sort"></i>
                        </button>
                    </th>
                    <th>Užimamas plotas</th>
                    <th>Gyventojų skaičius</th>
                    <th>Šalies tel. kodas</th>
                    <th>Veiksmai</th>
                </tr>
            `;
    let filteredCountryList = countryList;
    if (
        toggledFilter &&
        document.getElementById("dateInput").value !== "" &&
        filterDate !== ""
    ) {
        filteredCountryList = countryList.map((country) => {
            if (country.created_at.slice(0, 10) === filterDate) return country;
        });
    }
    filteredCountryList = filteredCountryList.filter(function (element) {
        return element !== undefined;
    });
    const list = filteredCountryList
        ? filteredCountryList
              .slice(start, end)
              .map((country) => {
                  return `<tr class="tableRow">
                    <td><a href="./cities/index.html?id=${country.id}&name=${country.name}">${country.name}</a></td>
                    <td>${country.area}</td>
                    <td>${country.population}</td>
                    <td>${country.calling_code}</td>
                    <td class="tableActionButtons">
                        <button onclick="deleteItem(${country.id},'${country.name}')" class="iconButton">
                            <i class="fas fa-trash"></i>
                        </button>
                        <span>|</span>
                        <button onclick="editItem(${country.id})" class="iconButton">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </td>
                </tr>`;
              })
              .join("")
        : "";
    html += list;
    ul.innerHTML = html;
};

// Close delete confirm modal

const cancelDelete = () => {
    modal.style.display = "none";
};

// Open delete confirm modal

const deleteItem = (id, name) => {
    document.getElementById("confirmDeleteButton").innerHTML = `
        <button id="confirmDeleteButton" onclick="confirmDelete(${id})" class="modalYes boxShadow buttonStyle">
            <i class="fas fa-check"></i>
        </button>`;
    document.getElementById("countryName").innerText = name;
    modal.style.display = "block";
};

// Perform delete for given id
// first it removes the given line from existing array.
// Once it's finished it will delete it from the database.
// This could cause some issues if the item is deleted locally,
// but remains in database due to delete fail.

const confirmDelete = (id) => {
    array.map((country, index) => {
        if (country.id == id) {
            modal.style.display = "none";
            popInfo(`${array[index].name} ištrinta sėkmingai`);
            delete array[index];
            appendElements(array);
        }
    });
    deleteCountry(id);
};

const deleteCountry = async (id) => {
    try {
        const response = await fetch(url + `/${id}`, {
            method: "DELETE",
        });
    } catch (err) {
        popInfo(err);
    }
};

// Opens modal for creating/editing

const addCountry = () => {
    clearModal();
    formModal.style.display = "block";
    document.getElementById("formTitle").innerText = "PRIDĖTI ŠALĮ";
    document.getElementById("modalButtonContainer").innerHTML = `
    <input  autocomplete="off"
            class="boxShadow buttonStyle modalButton"
            type="submit" value="SAUGOTI"
            onclick="submitCountry()">`;
};

// Unlike delete where it removes to the array and then performs api request
// This will do that imediately and perform a fetch data function
// This is slightly better if you want to see the data immediately,
// However at a cost of a 2nd fetch request in itself.

const submitCountry = async () => {
    if (
        nameIn.value !== "" &&
        areaIn.value !== "" &&
        populationIn.value !== "" &&
        codeIn.value !== "" &&
        nameIn.value.length > 3
    ) {
        try {
            const response = await fetch(
                url +
                    `?name=${nameIn.value}` +
                    `&area=${areaIn.value}` +
                    `&population=${populationIn.value}` +
                    `&calling_code=${codeIn.value}`,
                { method: "POST" }
            );
            formModal.style.display = "none";
            popInfo(`${nameIn.value} sukurta sėkmingai`);
            getData();
        } catch (err) {
            popInfo(err);
        }
    }
};

// Opens add/edit modal and populates the fields with existing data

const editItem = (id) => {
    let editCountry;
    array.map((country) => {
        if (country.id === id) {
            editCountry = country;
        }
    });

    nameIn.value = editCountry.name;
    areaIn.value = editCountry.area;
    populationIn.value = editCountry.population;
    codeIn.value = editCountry.calling_code;

    formModal.style.display = "block";
    document.getElementById("formTitle").innerText = "REDAGUOTI ŠALĮ";
    document.getElementById("modalButtonContainer").innerHTML = `
    <input  autocomplete="off"
            class="modalButton
            buttonStyle boxShadow"
            type="submit"
            value="SAUGOTI"
            onclick="editCountry(${editCountry.id})">`;
};

// This works similarly to delete.
// It updates existing data without fetching a new request

const editCountry = async (id) => {
    if (
        nameIn.value !== "" &&
        areaIn.value !== "" &&
        populationIn.value !== "" &&
        codeIn.value !== "" &&
        nameIn.value.length > 3
    ) {
        try {
            const response = await fetch(
                url +
                    `/${id}?name=${nameIn.value}` +
                    `&area=${areaIn.value}` +
                    `&population=${populationIn.value}` +
                    `&calling_code=${codeIn.value}`,
                { method: "PUT" }
            );
            array.map((country) => {
                if (country.id === id) {
                    country.calling_code = codeIn.value;
                    country.name = nameIn.value;
                    country.population = populationIn.value;
                    country.area = areaIn.value;
                }
            });
            appendElements(array);
            formModal.style.display = "none";
            popInfo(`${nameIn.value} pakeista sėkmingai`);
        } catch (err) {
            popInfo(err);
        }
    }
};

// Pagination movment functions.

const previousPage = () => {
    if (currentPage != 1) {
        start -= 10;
        end -= 10;
        currentPage--;
        appendElements(array);
    }
};

const nextPage = () => {
    if (currentPage < countryPages.length) {
        start += 10;
        end += 10;
        currentPage++;
        appendElements(array);
    }
};

const gotoPage = (pageNum) => {
    start = 10 * pageNum - 10;
    end = 10 * pageNum;
    currentPage = pageNum;
    appendElements(array);
};

// Search works with both lowercase and uppercase queries.
// It checks in the entire string so you can search for parts of a name

const searchItems = () => {
    let temparray = [];
    let query = document.getElementById("search").value;
    countries.map((country, index) => {
        if (country.name.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
            temparray[index] = country;
        }
    });
    array = temparray;
    appendElements(array);
};

// Right now if you have a date filter set but close the box
// It will disable the filter. This can be disabled by simply removing
// appendElements() lines and toggleFilter setter in 1st if block

const dateFilterToggle = () => {
    if (toggledFilter) {
        document.getElementById("filterBox").style.display = "none";
        toggledFilter = !toggledFilter;
        appendElements(array);
    } else {
        document.getElementById("filterBox").style.display = "flex";
        appendElements(array);
        toggledFilter = !toggledFilter;
    }
};

const filterByDate = () => {
    filterDate = document.getElementById("dateInput").value;
    appendElements(array);
};

const clearFilter = () => {
    filterDate = "";
    appendElements(array);
};

const sort = () => {
    if (type === "down") {
        array = countries;
        if (document.getElementById("search").value !== "") {
            searchItems();
        }
        type = "default";
    } else if (type === "default") {
        array.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
        type = "up";
    } else {
        array.reverse();
        type = "down";
    }
    appendElements(array);
};

// Displays an info box with given text

const popInfo = (text) => {
    textPlaceholder.innerText = text;
    infoBox.style.display = "flex";
    setTimeout(closeInfo, 3000);
};

const closeInfo = () => {
    infoBox.style.display = "none";
};

const clearModal = () => {
    nameIn.value = "";
    codeIn.value = "";
    populationIn.value = "";
    areaIn.value = "";
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    } else if (event.target == formModal) {
        formModal.style.display = "none";
    }
};

getData();

// This is left-over to when the api will give result count / page numbr
// I would ideally make it so when page is loaded it fetches only the first page and displays it imediately.
// After the page is fully loaded this function would be executed
// I would fetch the rest of the data required for pagination/display then.
// Due to lack of page numbers in api data I cannot fully implement this

/*document.onreadystatechange = () => {
    if (document.readyState == "complete") {

    }
}*/
